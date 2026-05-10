import AVFoundation
import React

@objc(KaviLiveAudio)
final class KaviLiveAudio: RCTEventEmitter {
  private let engine = AVAudioEngine()
  private let audioQueue = DispatchQueue(label: "com.kavikividya.liveaudio")
  private var converter: AVAudioConverter?
  private var converterInputSampleRate = 0.0
  private var converterInputChannelCount: AVAudioChannelCount = 0
  private var captureOutputFormat: AVAudioFormat?
  private var playbackFormat: AVAudioFormat?
  private var playerNode = AVAudioPlayerNode()
  private var isPlayerAttached = false
  private var isCapturing = false
  private var hasActiveListeners = false
  private let defaultSampleRate = 24000.0

  override static func requiresMainQueueSetup() -> Bool {
    false
  }

  override func supportedEvents() -> [String] {
    ["KaviLiveAudioChunk", "KaviLiveAudioState", "KaviLiveAudioError"]
  }

  override func startObserving() {
    hasActiveListeners = true
  }

  override func stopObserving() {
    hasActiveListeners = false
  }

  @objc(start:resolver:rejecter:)
  func start(_ options: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    requestRecordPermission { [weak self] granted in
      guard let self else { return }
      guard granted else {
        reject("microphone_denied", "Microphone permission is not enabled.", nil)
        return
      }

      self.audioQueue.async {
        do {
          try self.startCapture(options: options)
          resolve([
            "sampleRate": self.defaultSampleRate,
            "isCapturing": true,
          ])
        } catch {
          reject("live_audio_start_failed", error.localizedDescription, error)
        }
      }
    }
  }

  @objc(stopCapture:rejecter:)
  func stopCapture(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      self.stopCaptureInternal()
      resolve(["isCapturing": false])
    }
  }

  @objc(playPcmChunk:resolver:rejecter:)
  func playPcmChunk(_ base64Audio: NSString, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      do {
        try self.schedulePlaybackChunk(String(base64Audio))
        resolve(["queued": true])
      } catch {
        reject("live_audio_play_failed", error.localizedDescription, error)
      }
    }
  }

  @objc(clearPlayback:rejecter:)
  func clearPlayback(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      self.playerNode.stop()
      self.playerNode.reset()
      resolve(["cleared": true])
    }
  }

  @objc(stop:rejecter:)
  func stop(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    audioQueue.async {
      self.stopCaptureInternal()
      self.playerNode.stop()
      self.playerNode.reset()
      self.engine.stop()
      try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
      resolve(["isCapturing": false])
    }
  }

  private func requestRecordPermission(_ completion: @escaping (Bool) -> Void) {
    if #available(iOS 17.0, *) {
      AVAudioApplication.requestRecordPermission(completionHandler: completion)
    } else {
      AVAudioSession.sharedInstance().requestRecordPermission(completion)
    }
  }

  private func configureAudioSession() throws {
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
    try session.setPreferredSampleRate(defaultSampleRate)
    try session.setPreferredIOBufferDuration(0.04)
    try session.setActive(true)
  }

  private func ensurePlaybackNode() {
    if isPlayerAttached {
      return
    }

    playbackFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: defaultSampleRate, channels: 1, interleaved: false)
    engine.attach(playerNode)
    engine.connect(playerNode, to: engine.mainMixerNode, format: playbackFormat)
    isPlayerAttached = true
  }

  private func ensureEngineRunning() throws {
    ensurePlaybackNode()
    if !engine.isRunning {
      engine.prepare()
      try engine.start()
    }
  }

  private func startCapture(options: NSDictionary) throws {
    if isCapturing {
      return
    }

    try configureAudioSession()
    try ensureEngineRunning()
    let inputNode = engine.inputNode
    guard let outputFormat = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: defaultSampleRate, channels: 1, interleaved: true) else {
      throw LiveAudioError.invalidFormat
    }
    guard let tapFormat = getValidInputFormat(inputNode) else {
      throw LiveAudioError.microphoneUnavailable
    }

    converter = nil
    converterInputSampleRate = 0
    converterInputChannelCount = 0
    captureOutputFormat = outputFormat

    let bufferSize = AVAudioFrameCount((options["bufferSize"] as? NSNumber)?.intValue ?? 2048)
    inputNode.removeTap(onBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: tapFormat) { [weak self] buffer, _ in
      self?.handleInputBuffer(buffer)
    }

    isCapturing = true
    emitState("capturing")
  }

  private func getValidInputFormat(_ inputNode: AVAudioInputNode) -> AVAudioFormat? {
    for _ in 0..<8 {
      let outputFormat = inputNode.outputFormat(forBus: 0)
      if outputFormat.sampleRate > 0, outputFormat.channelCount > 0 {
        return outputFormat
      }

      let inputFormat = inputNode.inputFormat(forBus: 0)
      if inputFormat.sampleRate > 0, inputFormat.channelCount > 0 {
        return inputFormat
      }

      Thread.sleep(forTimeInterval: 0.06)
    }

    return nil
  }

  private func stopCaptureInternal() {
    if isCapturing {
      engine.inputNode.removeTap(onBus: 0)
    }
    isCapturing = false
    converter = nil
    converterInputSampleRate = 0
    converterInputChannelCount = 0
    captureOutputFormat = nil
    emitState("idle")
  }

  private func handleInputBuffer(_ buffer: AVAudioPCMBuffer) {
    guard hasActiveListeners, let outputFormat = captureOutputFormat else {
      return
    }

    guard buffer.format.sampleRate > 0, buffer.format.channelCount > 0 else {
      return
    }

    if converter == nil || converterInputSampleRate != buffer.format.sampleRate || converterInputChannelCount != buffer.format.channelCount {
      converter = AVAudioConverter(from: buffer.format, to: outputFormat)
      converterInputSampleRate = buffer.format.sampleRate
      converterInputChannelCount = buffer.format.channelCount
    }

    guard let converter else {
      emitError(LiveAudioError.invalidFormat.localizedDescription)
      return
    }

    let ratio = outputFormat.sampleRate / buffer.format.sampleRate
    let frameCapacity = AVAudioFrameCount(max(1, ceil(Double(buffer.frameLength) * ratio) + 16))
    guard let convertedBuffer = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: frameCapacity) else {
      return
    }

    var didProvideInput = false
    var conversionError: NSError?
    converter.convert(to: convertedBuffer, error: &conversionError) { _, outStatus in
      if didProvideInput {
        outStatus.pointee = .noDataNow
        return nil
      }

      didProvideInput = true
      outStatus.pointee = .haveData
      return buffer
    }

    if let conversionError {
      emitError(conversionError.localizedDescription)
      return
    }

    guard convertedBuffer.frameLength > 0 else {
      return
    }

    let audioBuffer = convertedBuffer.audioBufferList.pointee.mBuffers
    guard let audioData = audioBuffer.mData, audioBuffer.mDataByteSize > 0 else {
      return
    }

    let level = calculateLevel(audioBuffer)
    let chunk = Data(bytes: audioData, count: Int(audioBuffer.mDataByteSize)).base64EncodedString()
    DispatchQueue.main.async { [weak self] in
      guard let self, self.hasActiveListeners else { return }
      self.sendEvent(withName: "KaviLiveAudioChunk", body: [
        "audio": chunk,
        "sampleRate": self.defaultSampleRate,
        "level": level,
      ])
    }
  }

  private func calculateLevel(_ audioBuffer: AudioBuffer) -> Double {
    guard let audioData = audioBuffer.mData else {
      return 0
    }

    let sampleCount = Int(audioBuffer.mDataByteSize) / MemoryLayout<Int16>.size
    guard sampleCount > 0 else {
      return 0
    }

    let samples = audioData.bindMemory(to: Int16.self, capacity: sampleCount)
    let step = max(1, sampleCount / 240)
    var total = 0.0
    var measuredSamples = 0

    for index in stride(from: 0, to: sampleCount, by: step) {
      total += min(Double(abs(Int(samples[index]))) / Double(Int16.max), 1)
      measuredSamples += 1
    }

    guard measuredSamples > 0 else {
      return 0
    }

    return total / Double(measuredSamples)
  }

  private func schedulePlaybackChunk(_ base64Audio: String) throws {
    try configureAudioSession()
    try ensureEngineRunning()
    guard let playbackFormat else {
      throw LiveAudioError.invalidFormat
    }
    guard let audioData = Data(base64Encoded: base64Audio) else {
      throw LiveAudioError.invalidBase64
    }

    let sampleCount = audioData.count / MemoryLayout<Int16>.size
    guard sampleCount > 0, let playbackBuffer = AVAudioPCMBuffer(pcmFormat: playbackFormat, frameCapacity: AVAudioFrameCount(sampleCount)) else {
      return
    }

    playbackBuffer.frameLength = AVAudioFrameCount(sampleCount)
    guard let floatChannel = playbackBuffer.floatChannelData?[0] else {
      throw LiveAudioError.invalidFormat
    }

    audioData.withUnsafeBytes { rawBuffer in
      let samples = rawBuffer.bindMemory(to: Int16.self)
      for index in 0..<sampleCount {
        floatChannel[index] = Float(samples[index]) / Float(Int16.max)
      }
    }

    playerNode.scheduleBuffer(playbackBuffer, completionHandler: nil)
    if !playerNode.isPlaying {
      playerNode.play()
    }
  }

  private func emitState(_ state: String) {
    DispatchQueue.main.async { [weak self] in
      guard let self, self.hasActiveListeners else { return }
      self.sendEvent(withName: "KaviLiveAudioState", body: [
        "state": state,
      ])
    }
  }

  private func emitError(_ message: String) {
    DispatchQueue.main.async { [weak self] in
      guard let self, self.hasActiveListeners else { return }
      self.sendEvent(withName: "KaviLiveAudioError", body: [
        "message": message,
      ])
    }
  }
}

private enum LiveAudioError: LocalizedError {
  case invalidFormat
  case invalidBase64
  case microphoneUnavailable

  var errorDescription: String? {
    switch self {
    case .invalidFormat:
      return "Live audio could not create a 24 kHz mono PCM format."
    case .invalidBase64:
      return "Live audio received an invalid PCM chunk."
    case .microphoneUnavailable:
      return "The simulator microphone is not ready yet. Try starting the mic again."
    }
  }
}
