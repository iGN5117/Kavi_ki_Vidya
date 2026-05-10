import type { Lesson } from "@/src/types/content";

export const lessons: Lesson[] = [
  {
    id: "greetings-intro",
    moduleId: "first-sentences",
    title: "Say Hello And Introduce Yourself",
    durationMinutes: 4,
    overview:
      "You will practice greeting someone, saying your name, and using one polite sentence with confidence.",
    skipOverview: [
      "Simple greetings like hello and good morning",
      "Saying your name using 'My name is...'",
      "One polite sentence: 'Nice to meet you'",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Listen, read, and tap Meaning if you want help.",
        sentence: {
          id: "hello-good-morning",
          targetLanguage: "en-IN",
          targetText: "Hello, good morning.",
          support: {
            "hi-Deva": "नमस्ते, सुप्रभात।",
            "hi-Latn": "Namaste, good morning.",
          },
          notes: {
            "hi-Deva": "किसी से बात शुरू करने के लिए यह आसान और विनम्र वाक्य है।",
            "hi-Latn": "Kisi se baat shuru karne ke liye yeh easy aur polite sentence hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Now introduce yourself.",
        sentence: {
          id: "my-name-is",
          targetLanguage: "en-IN",
          targetText: "My name is Kavita.",
          support: {
            "hi-Deva": "मेरा नाम कविता है।",
            "hi-Latn": "Mera naam Kavita hai.",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which sentence is better for introducing yourself?",
        options: ["My name is Kavita.", "Name my Kavita.", "I Kavita name."],
        answer: "My name is Kavita.",
        explanation: {
          "hi-Deva": "'My name is...' अपना नाम बताने का सही और आसान तरीका है।",
          "hi-Latn": "'My name is...' apna naam batane ka sahi aur easy tareeka hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the words to make a friendly sentence.",
        words: ["Nice", "to", "meet", "you."],
        answer: ["Nice", "to", "meet", "you."],
        explanation: {
          "hi-Deva": "English में अभिवादन के बाद 'Nice to meet you' एक पूरा और विनम्र वाक्य है।",
          "hi-Latn": "English mein greeting ke baad 'Nice to meet you' ek complete aur polite sentence hai.",
        },
      },
      {
        type: "speak",
        prompt: "Speak this sentence slowly and clearly.",
        sentence: {
          id: "nice-to-meet-you",
          targetLanguage: "en-IN",
          targetText: "Nice to meet you.",
          support: {
            "hi-Deva": "आपसे मिलकर अच्छा लगा।",
            "hi-Latn": "Aapse milkar achha laga.",
          },
        },
      },
    ],
  },
  {
    id: "polite-help",
    moduleId: "first-sentences",
    title: "Ask For Help Politely",
    durationMinutes: 3,
    overview: "You will practice asking for help and saying please in a simple, respectful way.",
    skipOverview: [
      "Asking 'Can you help me?'",
      "Using 'please' naturally",
      "Saying 'I do not understand' without fear",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Use this when you need help.",
        sentence: {
          id: "can-you-help",
          targetLanguage: "en-IN",
          targetText: "Can you help me, please?",
          support: {
            "hi-Deva": "क्या आप मेरी मदद कर सकते हैं, कृपया?",
            "hi-Latn": "Kya aap meri madad kar sakte hain, please?",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which sentence is polite and correct?",
        options: ["Can you help me, please?", "You help me now.", "Help my please."],
        answer: "Can you help me, please?",
        explanation: {
          "hi-Deva": "'Can you...' और 'please' मिलकर वाक्य को विनम्र बनाते हैं।",
          "hi-Latn": "'Can you...' aur 'please' sentence ko polite banate hain.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Put these words in a natural question order.",
        words: ["I", "do", "not", "understand."],
        answer: ["I", "do", "not", "understand."],
        explanation: {
          "hi-Deva": "'I do not...' बोलने से वाक्य साफ और सही बनता है।",
          "hi-Latn": "'I do not...' bolne se sentence clear aur correct banta hai.",
        },
      },
      {
        type: "speak",
        prompt: "Say this when something is confusing.",
        sentence: {
          id: "do-not-understand",
          targetLanguage: "en-IN",
          targetText: "I do not understand.",
          support: {
            "hi-Deva": "मुझे समझ नहीं आया।",
            "hi-Latn": "Mujhe samajh nahi aaya.",
          },
        },
      },
    ],
  },
  {
    id: "family-routine",
    moduleId: "home-family",
    title: "Talk About Your Family",
    durationMinutes: 5,
    overview: "You will practice simple sentences about family members and daily routines at home.",
    skipOverview: [
      "Saying who is in your family",
      "Using 'I have...' for family",
      "Talking about one daily routine",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Start with a simple family sentence.",
        sentence: {
          id: "i-have-two-children",
          targetLanguage: "en-IN",
          targetText: "I have two children.",
          support: {
            "hi-Deva": "मेरे दो बच्चे हैं।",
            "hi-Latn": "Mere do bachche hain.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Talk about your routine.",
        sentence: {
          id: "cook-breakfast",
          targetLanguage: "en-IN",
          targetText: "I cook breakfast in the morning.",
          support: {
            "hi-Deva": "मैं सुबह नाश्ता बनाती हूँ।",
            "hi-Latn": "Main subah nashta banati hoon.",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which sentence sounds natural?",
        options: ["I cook breakfast in the morning.", "I cooking breakfast morning.", "Breakfast I cook morning."],
        answer: "I cook breakfast in the morning.",
        explanation: {
          "hi-Deva": "Simple present में 'I cook...' रोज़ की आदत के लिए सही है।",
          "hi-Latn": "Simple present mein 'I cook...' daily habit ke liye sahi hai.",
        },
      },
      {
        type: "fillBlank",
        prompt: "Fill the blank to complete the daily routine sentence.",
        sentenceStart: "I ",
        sentenceEnd: " breakfast in the morning.",
        options: ["cook", "cooks", "cooking"],
        answer: "cook",
        explanation: {
          "hi-Deva": "'I' के साथ रोज़ की आदत बताने के लिए simple verb आता है: 'I cook'।",
          "hi-Latn": "'I' ke saath daily habit batane ke liye simple verb aata hai: 'I cook'.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the words for a simple family sentence.",
        words: ["My", "family", "is", "small."],
        answer: ["My", "family", "is", "small."],
        explanation: {
          "hi-Deva": "English में अक्सर पहले व्यक्ति या चीज़ आती है, फिर 'is', फिर उसका वर्णन।",
          "hi-Latn": "English mein aksar pehle person ya thing aata hai, phir 'is', phir uska description.",
        },
      },
      {
        type: "speak",
        prompt: "Say this slowly.",
        sentence: {
          id: "my-family-is-small",
          targetLanguage: "en-IN",
          targetText: "My family is small.",
          support: {
            "hi-Deva": "मेरा परिवार छोटा है।",
            "hi-Latn": "Mera parivaar chhota hai.",
          },
        },
      },
    ],
  },
  {
    id: "home-needs",
    moduleId: "home-family",
    title: "Ask For Things At Home",
    durationMinutes: 4,
    overview: "You will practice asking for simple things at home using short and polite English.",
    skipOverview: [
      "Asking for water",
      "Saying something is finished",
      "Requesting help with one small task",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Ask for water in a simple way.",
        sentence: {
          id: "please-give-water",
          targetLanguage: "en-IN",
          targetText: "Please give me some water.",
          support: {
            "hi-Deva": "कृपया मुझे थोड़ा पानी दीजिए।",
            "hi-Latn": "Please mujhe thoda paani dijiye.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Use this when something is over.",
        sentence: {
          id: "milk-is-finished",
          targetLanguage: "en-IN",
          targetText: "The milk is finished.",
          support: {
            "hi-Deva": "दूध खत्म हो गया है।",
            "hi-Latn": "Doodh khatam ho gaya hai.",
          },
        },
      },
      {
        type: "fillBlank",
        prompt: "Choose the home item that completes the sentence.",
        sentenceStart: "The ",
        sentenceEnd: " is finished.",
        options: ["milk", "give", "please"],
        answer: "milk",
        explanation: {
          "hi-Deva": "'The milk is finished' में 'milk' चीज़ का नाम है। 'is finished' बताता है कि वह खत्म हो गया है।",
          "hi-Latn": "'The milk is finished' mein 'milk' cheez ka naam hai. 'is finished' batata hai ki woh khatam ho gaya hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the request in a polite order.",
        words: ["Please", "give", "me", "some", "water."],
        answer: ["Please", "give", "me", "some", "water."],
        explanation: {
          "hi-Deva": "'Please' को शुरू में रखने से अनुरोध तुरंत विनम्र लगता है।",
          "hi-Latn": "'Please' ko start mein rakhne se request turant polite lagti hai.",
        },
      },
      {
        type: "speak",
        prompt: "Ask for a little help.",
        sentence: {
          id: "help-in-kitchen",
          targetLanguage: "en-IN",
          targetText: "Can you help me in the kitchen?",
          support: {
            "hi-Deva": "क्या आप रसोई में मेरी मदद कर सकते हैं?",
            "hi-Latn": "Kya aap rasoi mein meri madad kar sakte hain?",
          },
        },
      },
    ],
  },
  {
    id: "guest-at-home",
    moduleId: "home-family",
    title: "Welcome A Guest",
    durationMinutes: 5,
    overview: "You will practice simple English for welcoming a guest and offering tea or water.",
    skipOverview: [
      "Welcoming someone inside",
      "Offering tea or water",
      "Speaking politely to a guest",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Say this when a guest comes home.",
        sentence: {
          id: "please-come-in",
          targetLanguage: "en-IN",
          targetText: "Please come in.",
          support: {
            "hi-Deva": "कृपया अंदर आइए।",
            "hi-Latn": "Please andar aaiye.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Offer tea politely.",
        sentence: {
          id: "would-you-like-tea",
          targetLanguage: "en-IN",
          targetText: "Would you like some tea?",
          support: {
            "hi-Deva": "क्या आप थोड़ी चाय लेना चाहेंगे?",
            "hi-Latn": "Kya aap thodi chai lena chahenge?",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask someone to sit.",
        sentence: {
          id: "please-sit-here",
          targetLanguage: "en-IN",
          targetText: "Please sit here.",
          support: {
            "hi-Deva": "कृपया यहाँ बैठिए।",
            "hi-Latn": "Please yahan baithiye.",
          },
        },
      },
      {
        type: "fillBlank",
        prompt: "Complete the polite offer.",
        sentenceStart: "Would you like ",
        sentenceEnd: " tea?",
        options: ["some", "is", "bring"],
        answer: "some",
        explanation: {
          "hi-Deva": "खाने-पीने की चीज़ offer करते समय 'some tea' बहुत natural और polite लगता है।",
          "hi-Latn": "Khaane-peene ki cheez offer karte time 'some tea' bahut natural aur polite lagta hai.",
        },
      },
      {
        type: "speak",
        prompt: "Say this in a warm voice.",
        sentence: {
          id: "i-will-bring-water",
          targetLanguage: "en-IN",
          targetText: "I will bring water.",
          support: {
            "hi-Deva": "मैं पानी लेकर आती हूँ।",
            "hi-Latn": "Main paani lekar aati hoon.",
          },
        },
      },
    ],
  },
  {
    id: "child-school-day",
    moduleId: "home-family",
    title: "Ask About A Child's Day",
    durationMinutes: 4,
    overview: "You will practice easy family sentences for homework, school, and a child's routine.",
    skipOverview: [
      "Asking about school",
      "Talking about homework",
      "Giving one gentle reminder",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Ask this after school.",
        sentence: {
          id: "how-was-school",
          targetLanguage: "en-IN",
          targetText: "How was school today?",
          support: {
            "hi-Deva": "आज स्कूल कैसा था?",
            "hi-Latn": "Aaj school kaisa tha?",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask about homework.",
        sentence: {
          id: "do-you-have-homework",
          targetLanguage: "en-IN",
          targetText: "Do you have homework?",
          support: {
            "hi-Deva": "क्या तुम्हें होमवर्क मिला है?",
            "hi-Latn": "Kya tumhe homework mila hai?",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Give a calm reminder.",
        sentence: {
          id: "finish-homework-first",
          targetLanguage: "en-IN",
          targetText: "Please finish your homework first.",
          support: {
            "hi-Deva": "कृपया पहले अपना होमवर्क पूरा करो।",
            "hi-Latn": "Please pehle apna homework poora karo.",
          },
        },
      },
      {
        type: "speak",
        prompt: "Say this with care.",
        sentence: {
          id: "i-am-proud-of-you",
          targetLanguage: "en-IN",
          targetText: "I am proud of you.",
          support: {
            "hi-Deva": "मुझे तुम पर गर्व है।",
            "hi-Latn": "Mujhe tum par garv hai.",
          },
        },
      },
    ],
  },
  {
    id: "shopping-price",
    moduleId: "shopping-directions",
    title: "Ask Price While Shopping",
    durationMinutes: 5,
    overview: "You will practice asking the price, quantity, and location of an item at a shop.",
    skipOverview: [
      "Asking 'How much is this?'",
      "Requesting one item politely",
      "Asking where something is",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Use this at a shop.",
        sentence: {
          id: "how-much",
          targetLanguage: "en-IN",
          targetText: "How much is this?",
          support: {
            "hi-Deva": "यह कितने का है?",
            "hi-Latn": "Yeh kitne ka hai?",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask for one item politely.",
        sentence: {
          id: "give-one",
          targetLanguage: "en-IN",
          targetText: "Please give me one packet.",
          support: {
            "hi-Deva": "कृपया मुझे एक पैकेट दीजिए।",
            "hi-Latn": "Please mujhe ek packet dijiye.",
          },
        },
      },
      {
        type: "fillBlank",
        prompt: "Fill the blank to ask for one packet.",
        sentenceStart: "Please give me ",
        sentenceEnd: " packet.",
        options: ["one", "how", "is"],
        answer: "one",
        explanation: {
          "hi-Deva": "'one packet' quantity बताता है। दुकान पर चीज़ मांगते समय यह साफ और आसान है।",
          "hi-Latn": "'one packet' quantity batata hai. Dukaan par cheez mangte time yeh clear aur easy hai.",
        },
      },
      {
        type: "choice",
        prompt: "Which sentence should you use to ask price?",
        options: ["How much is this?", "How many this price?", "This much how?"],
        answer: "How much is this?",
        explanation: {
          "hi-Deva": "कीमत पूछने के लिए 'How much is this?' सबसे आसान वाक्य है।",
          "hi-Latn": "Price poochne ke liye 'How much is this?' sabse easy sentence hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the words to ask the price.",
        words: ["How", "much", "is", "this?"],
        answer: ["How", "much", "is", "this?"],
        explanation: {
          "hi-Deva": "कीमत पूछते समय 'How much' साथ आता है, फिर 'is this?'।",
          "hi-Latn": "Price poochte time 'How much' saath aata hai, phir 'is this?'.",
        },
      },
      {
        type: "speak",
        prompt: "Say this when you need directions in a shop.",
        sentence: {
          id: "where-is-milk",
          targetLanguage: "en-IN",
          targetText: "Where is the milk?",
          support: {
            "hi-Deva": "दूध कहाँ है?",
            "hi-Latn": "Doodh kahan hai?",
          },
        },
      },
    ],
  },
  {
    id: "take-local-transport",
    moduleId: "shopping-directions",
    title: "Take Local Transport",
    durationMinutes: 3,
    overview: "You will practice short English sentences for asking the way and stopping nearby.",
    skipOverview: [
      "Saying where you want to go",
      "Asking if the place is near",
      "Requesting the driver to stop",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Tell the driver your place.",
        sentence: {
          id: "go-to-market",
          targetLanguage: "en-IN",
          targetText: "I want to go to the market.",
          support: {
            "hi-Deva": "मुझे बाज़ार जाना है।",
            "hi-Latn": "Mujhe bazaar jana hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask if the place is close.",
        sentence: {
          id: "is-it-near",
          targetLanguage: "en-IN",
          targetText: "Is it near?",
          support: {
            "hi-Deva": "क्या यह पास है?",
            "hi-Latn": "Kya yeh paas hai?",
          },
        },
      },
      {
        type: "speak",
        prompt: "Use this when you reach your stop.",
        sentence: {
          id: "please-stop-here",
          targetLanguage: "en-IN",
          targetText: "Please stop here.",
          support: {
            "hi-Deva": "कृपया यहाँ रोकिए।",
            "hi-Latn": "Please yahan rokiye.",
          },
        },
      },
    ],
  },
  {
    id: "clinic-medicine",
    moduleId: "community-errands",
    title: "Visit A Clinic Or Chemist",
    durationMinutes: 5,
    overview: "You will practice simple English for telling symptoms and asking about medicine.",
    skipOverview: [
      "Saying someone has fever",
      "Asking how to take medicine",
      "Checking if medicine is for children or adults",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Use this at a clinic.",
        sentence: {
          id: "my-son-has-fever",
          targetLanguage: "en-IN",
          targetText: "My son has fever.",
          support: {
            "hi-Deva": "मेरे बेटे को बुखार है।",
            "hi-Latn": "Mere bete ko bukhar hai.",
          },
          notes: {
            "hi-Deva": "भारत में लोग अक्सर 'has fever' बोलते हैं। यह साफ और समझने में आसान है।",
            "hi-Latn": "India mein log aksar 'has fever' bolte hain. Yeh clear aur easy to understand hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask about medicine clearly.",
        sentence: {
          id: "how-should-i-give-this-medicine",
          targetLanguage: "en-IN",
          targetText: "How should I give this medicine?",
          support: {
            "hi-Deva": "मुझे यह दवा कैसे देनी चाहिए?",
            "hi-Latn": "Mujhe yeh dawa kaise deni chahiye?",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which sentence is best at the chemist?",
        options: ["How should I give this medicine?", "Medicine how give?", "This medicine giving how?"],
        answer: "How should I give this medicine?",
        explanation: {
          "hi-Deva": "'How should I...' सलाह पूछने का सही और विनम्र तरीका है।",
          "hi-Latn": "'How should I...' advice poochne ka sahi aur polite tareeka hai.",
        },
      },
      {
        type: "fillBlank",
        prompt: "Complete the symptom sentence.",
        sentenceStart: "My daughter has ",
        sentenceEnd: ".",
        options: ["fever", "tablet", "chemist"],
        answer: "fever",
        explanation: {
          "hi-Deva": "'has fever' बीमारी या symptom बताने के लिए natural है।",
          "hi-Latn": "'has fever' illness ya symptom batane ke liye natural hai.",
        },
      },
      {
        type: "speak",
        prompt: "Ask this slowly at the medicine counter.",
        sentence: {
          id: "is-this-for-children",
          targetLanguage: "en-IN",
          targetText: "Is this medicine for children?",
          support: {
            "hi-Deva": "क्या यह दवा बच्चों के लिए है?",
            "hi-Latn": "Kya yeh dawa bachchon ke liye hai?",
          },
        },
      },
    ],
  },
  {
    id: "society-office-help",
    moduleId: "community-errands",
    title: "Talk At The Society Office",
    durationMinutes: 4,
    overview: "You will practice asking society office staff about bills, water, and simple home issues.",
    skipOverview: [
      "Asking about a maintenance bill",
      "Reporting no water at home",
      "Requesting one staff visit politely",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Ask about your bill.",
        sentence: {
          id: "maintenance-bill-due",
          targetLanguage: "en-IN",
          targetText: "Is my maintenance bill due?",
          support: {
            "hi-Deva": "क्या मेरा मेंटेनेंस बिल बाकी है?",
            "hi-Latn": "Kya mera maintenance bill baaki hai?",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Report a water problem.",
        sentence: {
          id: "no-water-at-home",
          targetLanguage: "en-IN",
          targetText: "There is no water at home.",
          support: {
            "hi-Deva": "घर में पानी नहीं है।",
            "hi-Latn": "Ghar mein paani nahi hai.",
          },
        },
      },
      {
        type: "fillBlank",
        prompt: "Choose the correct problem word.",
        sentenceStart: "There is no ",
        sentenceEnd: " at home.",
        options: ["water", "due", "visit"],
        answer: "water",
        explanation: {
          "hi-Deva": "'There is no water' से समस्या साफ बताई जाती है।",
          "hi-Latn": "'There is no water' se problem clear batayi jaati hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the request in a polite order.",
        words: ["Please", "send", "someone", "today."],
        answer: ["Please", "send", "someone", "today."],
        explanation: {
          "hi-Deva": "'Please send someone today' society office में मदद मांगने का सरल तरीका है।",
          "hi-Latn": "'Please send someone today' society office mein help mangne ka simple tareeka hai.",
        },
      },
      {
        type: "speak",
        prompt: "Request help politely.",
        sentence: {
          id: "please-send-someone-today",
          targetLanguage: "en-IN",
          targetText: "Please send someone today.",
          support: {
            "hi-Deva": "कृपया आज किसी को भेज दीजिए।",
            "hi-Latn": "Please aaj kisi ko bhej dijiye.",
          },
        },
      },
    ],
  },
  {
    id: "bank-atm-help",
    moduleId: "community-errands",
    title: "Ask For Bank Or ATM Help",
    durationMinutes: 4,
    overview: "You will practice simple English for bank counters, ATM problems, and form help.",
    skipOverview: [
      "Asking where to stand",
      "Saying the ATM is not working",
      "Requesting help with a form",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Ask where to go in the bank.",
        sentence: {
          id: "which-counter-for-deposit",
          targetLanguage: "en-IN",
          targetText: "Which counter is for cash deposit?",
          support: {
            "hi-Deva": "कैश जमा करने के लिए कौन सा काउंटर है?",
            "hi-Latn": "Cash jama karne ke liye kaun sa counter hai?",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Use this for an ATM problem.",
        sentence: {
          id: "atm-not-working",
          targetLanguage: "en-IN",
          targetText: "The ATM is not working.",
          support: {
            "hi-Deva": "एटीएम काम नहीं कर रहा है।",
            "hi-Latn": "ATM kaam nahi kar raha hai.",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which sentence clearly explains the ATM problem?",
        options: ["The ATM is not working.", "ATM no work.", "ATM is no working."],
        answer: "The ATM is not working.",
        explanation: {
          "hi-Deva": "'is not working' मशीन या service की समस्या बताने के लिए सही है।",
          "hi-Latn": "'is not working' machine ya service ki problem batane ke liye sahi hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the question for form help.",
        words: ["Can", "you", "help", "me", "with", "this", "form?"],
        answer: ["Can", "you", "help", "me", "with", "this", "form?"],
        explanation: {
          "hi-Deva": "'Can you help me with...' किसी काम में मदद मांगने का natural तरीका है।",
          "hi-Latn": "'Can you help me with...' kisi kaam mein help mangne ka natural tareeka hai.",
        },
      },
      {
        type: "speak",
        prompt: "Ask for help at the counter.",
        sentence: {
          id: "help-with-this-form",
          targetLanguage: "en-IN",
          targetText: "Can you help me with this form?",
          support: {
            "hi-Deva": "क्या आप इस फॉर्म में मेरी मदद कर सकते हैं?",
            "hi-Latn": "Kya aap is form mein meri madad kar sakte hain?",
          },
        },
      },
    ],
  },
  {
    id: "repair-service-call",
    moduleId: "community-errands",
    title: "Call For A Repair Service",
    durationMinutes: 5,
    overview: "You will practice simple phone English for calling a plumber, electrician, or appliance repair person.",
    skipOverview: [
      "Explaining what is not working",
      "Asking when someone can come",
      "Confirming your address politely",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Explain the problem on a call.",
        sentence: {
          id: "fan-not-working",
          targetLanguage: "en-IN",
          targetText: "The fan is not working.",
          support: {
            "hi-Deva": "पंखा काम नहीं कर रहा है।",
            "hi-Latn": "Pankha kaam nahi kar raha hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask for a visit time.",
        sentence: {
          id: "when-can-you-come",
          targetLanguage: "en-IN",
          targetText: "When can you come?",
          support: {
            "hi-Deva": "आप कब आ सकते हैं?",
            "hi-Latn": "Aap kab aa sakte hain?",
          },
        },
      },
      {
        type: "fillBlank",
        prompt: "Complete the service request.",
        sentenceStart: "The fan is not ",
        sentenceEnd: ".",
        options: ["working", "come", "address"],
        answer: "working",
        explanation: {
          "hi-Deva": "'not working' किसी चीज़ के खराब होने के लिए आसान और सही phrase है।",
          "hi-Latn": "'not working' kisi cheez ke kharab hone ke liye easy aur correct phrase hai.",
        },
      },
      {
        type: "choice",
        prompt: "Which question asks for the repair person's time?",
        options: ["When can you come?", "Where fan is come?", "You come when working?"],
        answer: "When can you come?",
        explanation: {
          "hi-Deva": "'When can you come?' समय पूछने का छोटा और natural सवाल है।",
          "hi-Latn": "'When can you come?' time poochne ka short aur natural question hai.",
        },
      },
      {
        type: "speak",
        prompt: "Confirm your address on the phone.",
        sentence: {
          id: "i-will-send-my-address",
          targetLanguage: "en-IN",
          targetText: "I will send my address on WhatsApp.",
          support: {
            "hi-Deva": "मैं अपना पता व्हाट्सऐप पर भेज दूँगी।",
            "hi-Latn": "Main apna pata WhatsApp par bhej doongi.",
          },
        },
      },
    ],
  },
  {
    id: "phone-call-basics",
    moduleId: "daily-conversations",
    title: "Make A Simple Phone Call",
    durationMinutes: 5,
    overview: "You will practice opening a phone call, asking for the right person, and leaving a short message.",
    skipOverview: [
      "Starting a phone call politely",
      "Asking to speak to someone",
      "Leaving one simple message",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Start a call in a clear way.",
        sentence: {
          id: "hello-this-is-kavita",
          targetLanguage: "en-IN",
          targetText: "Hello, this is Kavita speaking.",
          support: {
            "hi-Deva": "नमस्ते, कविता बोल रही हूँ।",
            "hi-Latn": "Namaste, Kavita bol rahi hoon.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask for the person you need.",
        sentence: {
          id: "may-i-speak-to-mrs-sharma",
          targetLanguage: "en-IN",
          targetText: "May I speak to Mrs Sharma?",
          support: {
            "hi-Deva": "क्या मैं मिसेज शर्मा से बात कर सकती हूँ?",
            "hi-Latn": "Kya main Mrs Sharma se baat kar sakti hoon?",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which phone sentence is polite and natural?",
        options: ["May I speak to Mrs Sharma?", "Give Sharma phone.", "I talking Sharma now."],
        answer: "May I speak to Mrs Sharma?",
        explanation: {
          "hi-Deva": "Phone पर 'May I speak to...' बहुत polite और common है।",
          "hi-Latn": "Phone par 'May I speak to...' bahut polite aur common hai.",
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of this message.",
        sentence: {
          id: "please-call-me-back-meaning",
          targetLanguage: "en-IN",
          targetText: "Please call me back.",
          support: {
            "hi-Deva": "कृपया मुझे वापस फोन कीजिए।",
            "hi-Latn": "Please mujhe wapas phone kijiye.",
          },
        },
        options: ["कृपया मुझे वापस फोन कीजिए।", "कृपया दरवाज़ा खोलिए।", "कृपया चाय बनाइए।"],
        answer: "कृपया मुझे वापस फोन कीजिए।",
        explanation: {
          "hi-Deva": "'Call me back' का मतलब है सामने वाला बाद में आपको phone करे।",
          "hi-Latn": "'Call me back' ka matlab hai saamne wala baad mein aapko phone kare.",
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the phone introduction.",
        incorrectSentence: "I speaking Kavita.",
        options: ["This is Kavita speaking.", "I speaking Kavita.", "Kavita is speak me."],
        answer: "This is Kavita speaking.",
        explanation: {
          "hi-Deva": "Phone पर अपना नाम बताने के लिए 'This is Kavita speaking' natural लगता है।",
          "hi-Latn": "Phone par apna naam batane ke liye 'This is Kavita speaking' natural lagta hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the message sentence.",
        words: ["Please", "call", "me", "back."],
        answer: ["Please", "call", "me", "back."],
        explanation: {
          "hi-Deva": "'Please call me back' छोटा और साफ message है।",
          "hi-Latn": "'Please call me back' short aur clear message hai.",
        },
      },
      {
        type: "speak",
        prompt: "Leave this short message.",
        sentence: {
          id: "please-call-me-back",
          targetLanguage: "en-IN",
          targetText: "Please call me back.",
          support: {
            "hi-Deva": "कृपया मुझे वापस फोन कीजिए।",
            "hi-Latn": "Please mujhe wapas phone kijiye.",
          },
        },
      },
    ],
  },
  {
    id: "neighbor-small-talk",
    moduleId: "daily-conversations",
    title: "Small Talk With A Neighbor",
    durationMinutes: 4,
    overview: "You will practice friendly sentences for greeting a neighbor and making light conversation.",
    skipOverview: [
      "Asking how someone is",
      "Saying your day is busy",
      "Inviting someone for tea",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Ask a friendly question.",
        sentence: {
          id: "how-are-you-today",
          targetLanguage: "en-IN",
          targetText: "How are you today?",
          support: {
            "hi-Deva": "आज आप कैसे हैं?",
            "hi-Latn": "Aaj aap kaise hain?",
          },
        },
      },
      {
        type: "fillBlank",
        prompt: "Complete the friendly answer.",
        sentenceStart: "I am ",
        sentenceEnd: " today.",
        options: ["busy", "tea", "neighbor"],
        answer: "busy",
        explanation: {
          "hi-Deva": "'I am busy today' अपना दिन बताने का आसान वाक्य है।",
          "hi-Latn": "'I am busy today' apna din batane ka easy sentence hai.",
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of this friendly question.",
        sentence: {
          id: "how-are-you-today-meaning",
          targetLanguage: "en-IN",
          targetText: "How are you today?",
          support: {
            "hi-Deva": "आज आप कैसे हैं?",
            "hi-Latn": "Aaj aap kaise hain?",
          },
        },
        options: ["आज आप कैसे हैं?", "आप कहाँ जा रही हैं?", "चाय तैयार है?"],
        answer: "आज आप कैसे हैं?",
        explanation: {
          "hi-Deva": "'How are you today?' हालचाल पूछने का friendly तरीका है।",
          "hi-Latn": "'How are you today?' haal-chaal poochne ka friendly tareeka hai.",
        },
      },
      {
        type: "sentence",
        prompt: "Invite someone warmly.",
        sentence: {
          id: "please-come-for-tea",
          targetLanguage: "en-IN",
          targetText: "Please come for tea.",
          support: {
            "hi-Deva": "कृपया चाय के लिए आइए।",
            "hi-Latn": "Please chai ke liye aaiye.",
          },
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the tea invitation.",
        incorrectSentence: "Come tea evening.",
        options: ["Please come for tea in the evening.", "Come tea evening.", "Evening tea you come."],
        answer: "Please come for tea in the evening.",
        explanation: {
          "hi-Deva": "'Please come for tea in the evening' invitation को clear और polite बनाता है।",
          "hi-Latn": "'Please come for tea in the evening' invitation ko clear aur polite banata hai.",
        },
      },
      {
        type: "speak",
        prompt: "Say this like a friendly invitation.",
        sentence: {
          id: "come-for-tea-evening",
          targetLanguage: "en-IN",
          targetText: "Please come for tea in the evening.",
          support: {
            "hi-Deva": "कृपया शाम को चाय के लिए आइए।",
            "hi-Latn": "Please shaam ko chai ke liye aaiye.",
          },
        },
      },
    ],
  },
  {
    id: "appointment-timing",
    moduleId: "daily-conversations",
    title: "Ask About Appointment Time",
    durationMinutes: 5,
    overview: "You will practice asking for a time, checking availability, and confirming an appointment.",
    skipOverview: [
      "Asking what time is available",
      "Saying you can come tomorrow",
      "Confirming the appointment politely",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Ask for a time.",
        sentence: {
          id: "what-time-is-available",
          targetLanguage: "en-IN",
          targetText: "What time is available?",
          support: {
            "hi-Deva": "कौन सा समय उपलब्ध है?",
            "hi-Latn": "Kaun sa time available hai?",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Say when you can come.",
        sentence: {
          id: "i-can-come-tomorrow",
          targetLanguage: "en-IN",
          targetText: "I can come tomorrow morning.",
          support: {
            "hi-Deva": "मैं कल सुबह आ सकती हूँ।",
            "hi-Latn": "Main kal subah aa sakti hoon.",
          },
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the appointment sentence.",
        incorrectSentence: "I come tomorrow morning.",
        options: ["I can come tomorrow morning.", "I come tomorrow morning.", "Tomorrow morning I coming."],
        answer: "I can come tomorrow morning.",
        explanation: {
          "hi-Deva": "'I can come...' availability बताने का साफ और सही तरीका है।",
          "hi-Latn": "'I can come...' availability batane ka clear aur correct tareeka hai.",
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of the appointment question.",
        sentence: {
          id: "what-time-is-available-meaning",
          targetLanguage: "en-IN",
          targetText: "What time is available?",
          support: {
            "hi-Deva": "कौन सा समय उपलब्ध है?",
            "hi-Latn": "Kaun sa time available hai?",
          },
        },
        options: ["कौन सा समय उपलब्ध है?", "आप कहाँ रहती हैं?", "क्या काम पूरा हो गया?"],
        answer: "कौन सा समय उपलब्ध है?",
        explanation: {
          "hi-Deva": "'What time is available?' appointment के लिए समय पूछता है।",
          "hi-Latn": "'What time is available?' appointment ke liye time poochta hai.",
        },
      },
      {
        type: "choice",
        prompt: "Which sentence confirms the appointment?",
        options: ["Okay, I will come at ten.", "I coming ten okay.", "Ten I will."],
        answer: "Okay, I will come at ten.",
        explanation: {
          "hi-Deva": "'I will come at ten' appointment confirm करने का साफ तरीका है।",
          "hi-Latn": "'I will come at ten' appointment confirm karne ka clear tareeka hai.",
        },
      },
      {
        type: "speak",
        prompt: "Confirm the time out loud.",
        sentence: {
          id: "i-will-come-at-ten",
          targetLanguage: "en-IN",
          targetText: "Okay, I will come at ten.",
          support: {
            "hi-Deva": "ठीक है, मैं दस बजे आऊँगी।",
            "hi-Latn": "Theek hai, main das baje aaungi.",
          },
        },
      },
    ],
  },
  {
    id: "explain-small-problem",
    moduleId: "daily-conversations",
    title: "Explain A Small Problem",
    durationMinutes: 5,
    overview: "You will practice explaining a simple problem and asking what to do next.",
    skipOverview: [
      "Starting with 'There is a problem'",
      "Explaining what is not working",
      "Asking what to do next",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Start with a simple problem sentence.",
        sentence: {
          id: "there-is-a-small-problem",
          targetLanguage: "en-IN",
          targetText: "There is a small problem.",
          support: {
            "hi-Deva": "एक छोटी समस्या है।",
            "hi-Latn": "Ek chhoti problem hai.",
          },
        },
      },
      {
        type: "fillBlank",
        prompt: "Complete the problem sentence.",
        sentenceStart: "The light is not ",
        sentenceEnd: ".",
        options: ["working", "tomorrow", "please"],
        answer: "working",
        explanation: {
          "hi-Deva": "'is not working' machine, light, fan, phone जैसी चीजों के लिए useful phrase है।",
          "hi-Latn": "'is not working' machine, light, fan, phone jaisi cheezon ke liye useful phrase hai.",
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the problem sentence.",
        incorrectSentence: "Light not working is.",
        options: ["The light is not working.", "Light not working is.", "The light no work."],
        answer: "The light is not working.",
        explanation: {
          "hi-Deva": "English में 'is not working' चीज़ के बाद आता है: 'The light is not working.'",
          "hi-Latn": "English mein 'is not working' cheez ke baad aata hai: 'The light is not working.'",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the next-step question.",
        words: ["What", "should", "I", "do", "now?"],
        answer: ["What", "should", "I", "do", "now?"],
        explanation: {
          "hi-Deva": "'What should I do now?' मदद या advice मांगने का natural सवाल है।",
          "hi-Latn": "'What should I do now?' help ya advice mangne ka natural sawal hai.",
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of the next-step question.",
        sentence: {
          id: "what-should-i-do-now-meaning",
          targetLanguage: "en-IN",
          targetText: "What should I do now?",
          support: {
            "hi-Deva": "अब मुझे क्या करना चाहिए?",
            "hi-Latn": "Ab mujhe kya karna chahiye?",
          },
        },
        options: ["अब मुझे क्या करना चाहिए?", "मैं कल आ सकती हूँ।", "समस्या छोटी है।"],
        answer: "अब मुझे क्या करना चाहिए?",
        explanation: {
          "hi-Deva": "'What should I do now?' advice या अगला step पूछने के लिए है।",
          "hi-Latn": "'What should I do now?' advice ya next step poochne ke liye hai.",
        },
      },
      {
        type: "speak",
        prompt: "Ask what to do next.",
        sentence: {
          id: "what-should-i-do-now",
          targetLanguage: "en-IN",
          targetText: "What should I do now?",
          support: {
            "hi-Deva": "अब मुझे क्या करना चाहिए?",
            "hi-Latn": "Ab mujhe kya karna chahiye?",
          },
        },
      },
    ],
  },
  {
    id: "plan-family-event",
    moduleId: "everyday-problem-solving",
    title: "Plan A Family Event",
    durationMinutes: 7,
    overview:
      "You will practice longer sentences for planning a small family function, checking availability, and confirming details.",
    skipOverview: [
      "Saying what you are planning",
      "Asking if someone is free",
      "Confirming time, place, and food politely",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Start with a clear planning sentence.",
        sentence: {
          id: "planning-small-dinner-sunday",
          targetLanguage: "en-IN",
          targetText: "We are planning a small dinner on Sunday.",
          support: {
            "hi-Deva": "हम रविवार को एक छोटा डिनर प्लान कर रहे हैं।",
            "hi-Latn": "Hum Sunday ko ek chhota dinner plan kar rahe hain.",
          },
          notes: {
            "hi-Deva": "'We are planning...' किसी आने वाले कार्यक्रम की तैयारी बताने के लिए natural है।",
            "hi-Latn": "'We are planning...' kisi aane wale event ki taiyari batane ke liye natural hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask about availability before inviting someone.",
        sentence: {
          id: "are-you-free-sunday-evening",
          targetLanguage: "en-IN",
          targetText: "Are you free on Sunday evening?",
          support: {
            "hi-Deva": "क्या आप रविवार शाम को फ्री हैं?",
            "hi-Latn": "Kya aap Sunday evening ko free hain?",
          },
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of this planning sentence.",
        sentence: {
          id: "planning-small-dinner-sunday-meaning",
          targetLanguage: "en-IN",
          targetText: "We are planning a small dinner on Sunday.",
          support: {
            "hi-Deva": "हम रविवार को एक छोटा डिनर प्लान कर रहे हैं।",
            "hi-Latn": "Hum Sunday ko ek chhota dinner plan kar rahe hain.",
          },
        },
        options: [
          "हम रविवार को एक छोटा डिनर प्लान कर रहे हैं।",
          "हमें रविवार को डॉक्टर के पास जाना है।",
          "हमने बाजार से सब्जी खरीदी।",
        ],
        answer: "हम रविवार को एक छोटा डिनर प्लान कर रहे हैं।",
        explanation: {
          "hi-Deva": "'Planning a small dinner' का मतलब है छोटे family dinner की तैयारी करना।",
          "hi-Latn": "'Planning a small dinner' ka matlab hai chhote family dinner ki taiyari karna.",
        },
      },
      {
        type: "fillBlank",
        prompt: "Complete the invitation question.",
        sentenceStart: "Are you free ",
        sentenceEnd: " Sunday evening?",
        options: ["on", "at", "in"],
        answer: "on",
        explanation: {
          "hi-Deva": "दिन के साथ 'on' आता है: 'on Sunday evening'।",
          "hi-Latn": "Din ke saath 'on' aata hai: 'on Sunday evening'.",
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the event planning sentence.",
        incorrectSentence: "We planning dinner Sunday.",
        options: [
          "We are planning a small dinner on Sunday.",
          "We planning dinner Sunday.",
          "Sunday we planning small dinner.",
        ],
        answer: "We are planning a small dinner on Sunday.",
        explanation: {
          "hi-Deva": "अभी चल रही planning के लिए 'We are planning...' सही structure है।",
          "hi-Latn": "Abhi chal rahi planning ke liye 'We are planning...' sahi structure hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the full invitation sentence.",
        words: ["Please", "come", "to", "our", "home", "for", "dinner", "tomorrow."],
        answer: ["Please", "come", "to", "our", "home", "for", "dinner", "tomorrow."],
        explanation: {
          "hi-Deva": "'Please come to our home for dinner tomorrow' में invitation, place, reason, और time सब साफ हैं।",
          "hi-Latn": "'Please come to our home for dinner tomorrow' mein invitation, place, reason, aur time sab clear hain.",
        },
      },
      {
        type: "speak",
        prompt: "Confirm the plan in one sentence.",
        sentence: {
          id: "we-will-keep-dinner-at-eight",
          targetLanguage: "en-IN",
          targetText: "We will keep dinner at eight.",
          support: {
            "hi-Deva": "हम डिनर आठ बजे रखेंगे।",
            "hi-Latn": "Hum dinner aath baje rakhenge.",
          },
        },
      },
    ],
  },
  {
    id: "explain-delay-change",
    moduleId: "everyday-problem-solving",
    title: "Explain A Delay Or Change",
    durationMinutes: 7,
    overview:
      "You will practice explaining why something is late, asking someone to wait, and suggesting a new time.",
    skipOverview: [
      "Using 'because' and 'so' in one situation",
      "Asking someone to wait politely",
      "Suggesting a new time when plans change",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Explain the reason for a delay.",
        sentence: {
          id: "delivery-delayed-shop-again",
          targetLanguage: "en-IN",
          targetText: "The delivery is delayed, so I will call the shop again.",
          support: {
            "hi-Deva": "डिलीवरी देर से आ रही है, इसलिए मैं दुकान पर फिर से फोन करूँगी।",
            "hi-Latn": "Delivery late aa rahi hai, isliye main dukaan par phir se phone karungi.",
          },
          notes: {
            "hi-Deva": "'so' से reason के बाद अगला action जुड़ता है।",
            "hi-Latn": "'So' se reason ke baad next action judta hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask for a little time politely.",
        sentence: {
          id: "please-wait-ten-minutes",
          targetLanguage: "en-IN",
          targetText: "Could you please wait for ten minutes?",
          support: {
            "hi-Deva": "क्या आप कृपया दस मिनट इंतज़ार कर सकते हैं?",
            "hi-Latn": "Kya aap please das minute wait kar sakte hain?",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which sentence gives a reason and a next action?",
        options: [
          "The delivery is delayed, so I will call the shop again.",
          "Delivery late shop call.",
          "I call because delayed so shop.",
        ],
        answer: "The delivery is delayed, so I will call the shop again.",
        explanation: {
          "hi-Deva": "पहले problem है, फिर 'so' के बाद आप क्या करेंगी यह आता है।",
          "hi-Latn": "Pehle problem hai, phir 'so' ke baad aap kya karengi yeh aata hai.",
        },
      },
      {
        type: "fillBlank",
        prompt: "Choose the word that connects reason to action.",
        sentenceStart: "The delivery is delayed, ",
        sentenceEnd: " I will call the shop again.",
        options: ["so", "but", "near"],
        answer: "so",
        explanation: {
          "hi-Deva": "'So' बताता है कि delay के कारण आप अगला काम करेंगी।",
          "hi-Latn": "'So' batata hai ki delay ke karan aap next kaam karengi.",
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the polite waiting request.",
        incorrectSentence: "You wait ten minutes please can?",
        options: [
          "Could you please wait for ten minutes?",
          "You wait ten minutes please can?",
          "Ten minutes wait you could?",
        ],
        answer: "Could you please wait for ten minutes?",
        explanation: {
          "hi-Deva": "'Could you please...' request को बहुत polite और natural बनाता है।",
          "hi-Latn": "'Could you please...' request ko bahut polite aur natural banata hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the sentence for changing a plan.",
        words: ["Can", "we", "meet", "after", "lunch", "instead?"],
        answer: ["Can", "we", "meet", "after", "lunch", "instead?"],
        explanation: {
          "hi-Deva": "'Instead' से पता चलता है कि आप नया option दे रही हैं।",
          "hi-Latn": "'Instead' se pata chalta hai ki aap naya option de rahi hain.",
        },
      },
      {
        type: "speak",
        prompt: "Suggest the new time clearly.",
        sentence: {
          id: "can-we-meet-after-lunch-instead",
          targetLanguage: "en-IN",
          targetText: "Can we meet after lunch instead?",
          support: {
            "hi-Deva": "क्या हम इसके बजाय लंच के बाद मिल सकते हैं?",
            "hi-Latn": "Kya hum iske bajay lunch ke baad mil sakte hain?",
          },
        },
      },
    ],
  },
  {
    id: "community-issue-follow-up",
    moduleId: "everyday-problem-solving",
    title: "Follow Up On A Community Issue",
    durationMinutes: 8,
    overview:
      "You will practice reporting an ongoing society issue, asking for updates, and requesting action respectfully.",
    skipOverview: [
      "Explaining an issue that has continued since yesterday",
      "Asking whether a complaint has been registered",
      "Requesting a clear update from the office",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Report an ongoing issue with time.",
        sentence: {
          id: "lift-stopping-since-yesterday",
          targetLanguage: "en-IN",
          targetText: "The lift has been stopping between floors since yesterday.",
          support: {
            "hi-Deva": "लिफ्ट कल से मंज़िलों के बीच रुक रही है।",
            "hi-Latn": "Lift kal se floors ke beech ruk rahi hai.",
          },
          notes: {
            "hi-Deva": "'has been stopping' बताता है कि problem अभी भी चल रही है।",
            "hi-Latn": "'Has been stopping' batata hai ki problem abhi bhi chal rahi hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask if the complaint is already noted.",
        sentence: {
          id: "has-complaint-been-registered",
          targetLanguage: "en-IN",
          targetText: "Has the complaint been registered?",
          support: {
            "hi-Deva": "क्या शिकायत दर्ज हो गई है?",
            "hi-Latn": "Kya complaint register ho gayi hai?",
          },
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of the ongoing issue.",
        sentence: {
          id: "lift-stopping-since-yesterday-meaning",
          targetLanguage: "en-IN",
          targetText: "The lift has been stopping between floors since yesterday.",
          support: {
            "hi-Deva": "लिफ्ट कल से मंज़िलों के बीच रुक रही है।",
            "hi-Latn": "Lift kal se floors ke beech ruk rahi hai.",
          },
        },
        options: [
          "लिफ्ट कल से मंज़िलों के बीच रुक रही है।",
          "लिफ्ट आज सुबह साफ कर दी गई।",
          "लिफ्ट में कोई सामान रखा है।",
        ],
        answer: "लिफ्ट कल से मंज़िलों के बीच रुक रही है।",
        explanation: {
          "hi-Deva": "'Since yesterday' बताता है कि problem कल से चल रही है।",
          "hi-Latn": "'Since yesterday' batata hai ki problem kal se chal rahi hai.",
        },
      },
      {
        type: "fillBlank",
        prompt: "Complete the ongoing problem sentence.",
        sentenceStart: "The lift has been stopping ",
        sentenceEnd: " floors since yesterday.",
        options: ["between", "under", "after"],
        answer: "between",
        explanation: {
          "hi-Deva": "दो मंज़िलों के बीच के लिए 'between floors' सही phrase है।",
          "hi-Latn": "Do floors ke beech ke liye 'between floors' sahi phrase hai.",
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the complaint question.",
        incorrectSentence: "Complaint registered has?",
        options: [
          "Has the complaint been registered?",
          "Complaint registered has?",
          "The complaint has register?",
        ],
        answer: "Has the complaint been registered?",
        explanation: {
          "hi-Deva": "Formal update पूछने के लिए 'Has the complaint been registered?' सही है।",
          "hi-Latn": "Formal update poochne ke liye 'Has the complaint been registered?' sahi hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the respectful follow-up request.",
        words: ["Could", "you", "please", "inform", "the", "maintenance", "team?"],
        answer: ["Could", "you", "please", "inform", "the", "maintenance", "team?"],
        explanation: {
          "hi-Deva": "'Could you please inform...' society office में respectful follow-up है।",
          "hi-Latn": "'Could you please inform...' society office mein respectful follow-up hai.",
        },
      },
      {
        type: "speak",
        prompt: "Ask for an update with confidence.",
        sentence: {
          id: "please-share-update-today",
          targetLanguage: "en-IN",
          targetText: "Please share an update by today evening.",
          support: {
            "hi-Deva": "कृपया आज शाम तक update बता दीजिए।",
            "hi-Latn": "Please aaj shaam tak update bata dijiye.",
          },
        },
      },
    ],
  },
  {
    id: "school-meeting-feedback",
    moduleId: "everyday-problem-solving",
    title: "Discuss Feedback At School",
    durationMinutes: 8,
    overview:
      "You will practice asking a teacher about progress, explaining home practice, and agreeing on next steps.",
    skipOverview: [
      "Starting a respectful school meeting",
      "Talking about a child's progress and practice",
      "Asking what to focus on at home",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Start the school conversation clearly.",
        sentence: {
          id: "discuss-daughter-progress",
          targetLanguage: "en-IN",
          targetText: "I would like to discuss my daughter's progress.",
          support: {
            "hi-Deva": "मैं अपनी बेटी की प्रगति पर बात करना चाहूँगी।",
            "hi-Latn": "Main apni beti ki progress par baat karna chahungi.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Explain what happens at home.",
        sentence: {
          id: "she-practices-reading-home",
          targetLanguage: "en-IN",
          targetText: "She practices reading at home, but she feels shy in class.",
          support: {
            "hi-Deva": "वह घर पर reading practice करती है, लेकिन class में शर्माती है।",
            "hi-Latn": "Woh ghar par reading practice karti hai, lekin class mein sharmati hai.",
          },
          notes: {
            "hi-Deva": "'But' से दो अलग बातें जुड़ती हैं: घर पर practice और class में hesitation।",
            "hi-Latn": "'But' se do alag baatein judti hain: ghar par practice aur class mein hesitation.",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which sentence is best for starting a teacher meeting?",
        options: [
          "I would like to discuss my daughter's progress.",
          "Daughter progress talk me.",
          "I want progress daughter now.",
        ],
        answer: "I would like to discuss my daughter's progress.",
        explanation: {
          "hi-Deva": "'I would like to discuss...' respectful और थोड़ा formal school English है।",
          "hi-Latn": "'I would like to discuss...' respectful aur thoda formal school English hai.",
        },
      },
      {
        type: "fillBlank",
        prompt: "Complete the contrast sentence.",
        sentenceStart: "She practices reading at home, ",
        sentenceEnd: " she feels shy in class.",
        options: ["but", "so", "near"],
        answer: "but",
        explanation: {
          "hi-Deva": "'But' तब आता है जब दूसरी बात पहली बात से अलग या उलटी हो।",
          "hi-Latn": "'But' tab aata hai jab doosri baat pehli baat se alag ya opposite ho.",
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of this school sentence.",
        sentence: {
          id: "focus-on-at-home-meaning",
          targetLanguage: "en-IN",
          targetText: "What should we focus on at home?",
          support: {
            "hi-Deva": "हमें घर पर किस बात पर ध्यान देना चाहिए?",
            "hi-Latn": "Humein ghar par kis baat par dhyan dena chahiye?",
          },
        },
        options: [
          "हमें घर पर किस बात पर ध्यान देना चाहिए?",
          "क्या बच्ची आज स्कूल आई थी?",
          "हमें फीस कहाँ जमा करनी है?",
        ],
        answer: "हमें घर पर किस बात पर ध्यान देना चाहिए?",
        explanation: {
          "hi-Deva": "'Focus on' का मतलब है किस चीज़ पर ध्यान देना या practice करनी है।",
          "hi-Latn": "'Focus on' ka matlab hai kis cheez par dhyan dena ya practice karni hai.",
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the home practice sentence.",
        incorrectSentence: "She reading practice at home but shy class.",
        options: [
          "She practices reading at home, but she feels shy in class.",
          "She reading practice at home but shy class.",
          "At home she practice reading but class shy.",
        ],
        answer: "She practices reading at home, but she feels shy in class.",
        explanation: {
          "hi-Deva": "'She practices...' और 'she feels...' दोनों complete parts हैं।",
          "hi-Latn": "'She practices...' aur 'she feels...' dono complete parts hain.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the next-step question.",
        words: ["What", "should", "we", "focus", "on", "at", "home?"],
        answer: ["What", "should", "we", "focus", "on", "at", "home?"],
        explanation: {
          "hi-Deva": "'What should we focus on at home?' teacher से next step पूछने का useful सवाल है।",
          "hi-Latn": "'What should we focus on at home?' teacher se next step poochne ka useful sawal hai.",
        },
      },
      {
        type: "speak",
        prompt: "Ask the teacher for a clear next step.",
        sentence: {
          id: "what-should-we-focus-on-home",
          targetLanguage: "en-IN",
          targetText: "What should we focus on at home?",
          support: {
            "hi-Deva": "हमें घर पर किस बात पर ध्यान देना चाहिए?",
            "hi-Latn": "Humein ghar par kis baat par dhyan dena chahiye?",
          },
        },
      },
    ],
  },
  {
    id: "polite-disagreement-preference",
    moduleId: "confident-community-conversations",
    title: "Disagree Politely And Explain A Preference",
    durationMinutes: 9,
    overview:
      "You will practice disagreeing respectfully, giving a reason, and explaining what you prefer in a family or society discussion.",
    skipOverview: [
      "Starting a disagreement with respect",
      "Explaining a preference with a reason",
      "Offering a softer alternative",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Use this when you do not fully agree.",
        sentence: {
          id: "understand-point-prefer-morning",
          targetLanguage: "en-IN",
          targetText: "I understand your point, but I would prefer a morning meeting because more parents can attend.",
          support: {
            "hi-Deva": "मैं आपकी बात समझती हूँ, लेकिन मैं सुबह की मीटिंग पसंद करूँगी क्योंकि ज़्यादा parents आ सकते हैं।",
            "hi-Latn": "Main aapki baat samajhti hoon, lekin main morning meeting prefer karungi kyunki zyada parents aa sakte hain.",
          },
          notes: {
            "hi-Deva": "'I understand your point, but...' disagreement को respectful बनाता है।",
            "hi-Latn": "'I understand your point, but...' disagreement ko respectful banata hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Give your preference with a clear reason.",
        sentence: {
          id: "prefer-smaller-menu",
          targetLanguage: "en-IN",
          targetText: "I prefer a smaller menu because it will be easier to manage at home.",
          support: {
            "hi-Deva": "मैं छोटा menu पसंद करती हूँ क्योंकि घर पर संभालना आसान होगा।",
            "hi-Latn": "Main chhota menu prefer karti hoon kyunki ghar par manage karna easy hoga.",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which sentence disagrees politely and gives a reason?",
        options: [
          "I understand your point, but I would prefer a morning meeting because more parents can attend.",
          "No, your idea is wrong and I do not want it.",
          "Morning meeting because parents attend I prefer.",
        ],
        answer: "I understand your point, but I would prefer a morning meeting because more parents can attend.",
        explanation: {
          "hi-Deva": "पहले आप सामने वाले की बात मानती हैं, फिर 'but' के बाद अपनी preference और reason देती हैं।",
          "hi-Latn": "Pehle aap saamne wale ki baat maanti hain, phir 'but' ke baad apni preference aur reason deti hain.",
        },
      },
      {
        type: "fillBlank",
        prompt: "Choose the word that introduces your reason.",
        sentenceStart: "I prefer a smaller menu ",
        sentenceEnd: " it will be easier to manage at home.",
        options: ["because", "although", "between"],
        answer: "because",
        explanation: {
          "hi-Deva": "'Because' reason बताने के लिए आता है। यहाँ reason है कि छोटा menu manage करना आसान होगा।",
          "hi-Latn": "'Because' reason batane ke liye aata hai. Yahan reason hai ki chhota menu manage karna easy hoga.",
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of this preference sentence.",
        sentence: {
          id: "prefer-smaller-menu-meaning",
          targetLanguage: "en-IN",
          targetText: "I prefer a smaller menu because it will be easier to manage at home.",
          support: {
            "hi-Deva": "मैं छोटा menu पसंद करती हूँ क्योंकि घर पर संभालना आसान होगा।",
            "hi-Latn": "Main chhota menu prefer karti hoon kyunki ghar par manage karna easy hoga.",
          },
        },
        options: [
          "मैं छोटा menu पसंद करती हूँ क्योंकि घर पर संभालना आसान होगा।",
          "मैं सुबह डॉक्टर के पास जाऊँगी।",
          "मुझे complaint register करनी है।",
        ],
        answer: "मैं छोटा menu पसंद करती हूँ क्योंकि घर पर संभालना आसान होगा।",
        explanation: {
          "hi-Deva": "'Prefer' का मतलब है किसी option को ज़्यादा पसंद करना।",
          "hi-Latn": "'Prefer' ka matlab hai kisi option ko zyada pasand karna.",
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the respectful disagreement.",
        incorrectSentence: "I understand point but prefer morning meeting because parents can attend more.",
        options: [
          "I understand your point, but I would prefer a morning meeting because more parents can attend.",
          "I understand point but prefer morning meeting because parents can attend more.",
          "Your point understand, but meeting morning prefer.",
        ],
        answer: "I understand your point, but I would prefer a morning meeting because more parents can attend.",
        explanation: {
          "hi-Deva": "'I would prefer...' disagreement को softer और polite बनाता है।",
          "hi-Latn": "'I would prefer...' disagreement ko softer aur polite banata hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the polite alternative.",
        words: ["Can", "we", "try", "a", "simpler", "plan", "instead?"],
        answer: ["Can", "we", "try", "a", "simpler", "plan", "instead?"],
        explanation: {
          "hi-Deva": "'Instead' से आप दूसरा option दे रही हैं, बिना rude लगे।",
          "hi-Latn": "'Instead' se aap doosra option de rahi hain, bina rude lage.",
        },
      },
      {
        type: "speak",
        prompt: "Say this as a calm suggestion.",
        sentence: {
          id: "try-simpler-plan-instead",
          targetLanguage: "en-IN",
          targetText: "Can we try a simpler plan instead?",
          support: {
            "hi-Deva": "क्या हम इसके बजाय एक आसान plan try कर सकते हैं?",
            "hi-Latn": "Kya hum iske bajay ek easy plan try kar sakte hain?",
          },
        },
      },
    ],
  },
  {
    id: "handle-misunderstanding-follow-up",
    moduleId: "confident-community-conversations",
    title: "Handle A Misunderstanding And Ask Follow-Up Questions",
    durationMinutes: 9,
    overview:
      "You will practice clearing up confusion, checking details, and asking follow-up questions when instructions are not clear.",
    skipOverview: [
      "Saying there may be a misunderstanding",
      "Asking someone to repeat or clarify",
      "Checking the next step with a follow-up question",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Use this when the message was confusing.",
        sentence: {
          id: "maybe-misunderstood-timing",
          targetLanguage: "en-IN",
          targetText: "I may have misunderstood the timing, so could you please confirm it once more?",
          support: {
            "hi-Deva": "शायद मैंने timing गलत समझी है, इसलिए क्या आप कृपया इसे एक बार और confirm कर सकते हैं?",
            "hi-Latn": "Shayad maine timing galat samjhi hai, isliye kya aap please ise ek baar aur confirm kar sakte hain?",
          },
          notes: {
            "hi-Deva": "'I may have misunderstood...' blame देने के बजाय confusion को politely बताता है।",
            "hi-Latn": "'I may have misunderstood...' blame dene ke bajay confusion ko politely batata hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask a follow-up question after a school message.",
        sentence: {
          id: "should-send-notebook-tomorrow",
          targetLanguage: "en-IN",
          targetText: "Should I send the notebook tomorrow, or should I wait for your message?",
          support: {
            "hi-Deva": "क्या मुझे notebook कल भेजनी चाहिए, या आपके message का इंतज़ार करना चाहिए?",
            "hi-Latn": "Kya mujhe notebook kal bhejni chahiye, ya aapke message ka wait karna chahiye?",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which sentence clears a misunderstanding politely?",
        options: [
          "I may have misunderstood the timing, so could you please confirm it once more?",
          "Your timing was wrong, say again.",
          "I not understand timing confirm more.",
        ],
        answer: "I may have misunderstood the timing, so could you please confirm it once more?",
        explanation: {
          "hi-Deva": "यह sentence अपनी confusion बताकर सामने वाले से confirmation मांगता है।",
          "hi-Latn": "Yeh sentence apni confusion batakar saamne wale se confirmation mangta hai.",
        },
      },
      {
        type: "fillBlank",
        prompt: "Choose the phrase that makes the question polite.",
        sentenceStart: "Could you please confirm it ",
        sentenceEnd: "?",
        options: ["once more", "very wrong", "no need"],
        answer: "once more",
        explanation: {
          "hi-Deva": "'Once more' का मतलब है एक बार फिर। Confirmation मांगते समय यह natural है।",
          "hi-Latn": "'Once more' ka matlab hai ek baar phir. Confirmation mangte time yeh natural hai.",
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of this follow-up question.",
        sentence: {
          id: "send-notebook-meaning",
          targetLanguage: "en-IN",
          targetText: "Should I send the notebook tomorrow, or should I wait for your message?",
          support: {
            "hi-Deva": "क्या मुझे notebook कल भेजनी चाहिए, या आपके message का इंतज़ार करना चाहिए?",
            "hi-Latn": "Kya mujhe notebook kal bhejni chahiye, ya aapke message ka wait karna chahiye?",
          },
        },
        options: [
          "क्या मुझे notebook कल भेजनी चाहिए, या आपके message का इंतज़ार करना चाहिए?",
          "क्या मैं dinner आठ बजे रखूँ?",
          "क्या lift कल से बंद है?",
        ],
        answer: "क्या मुझे notebook कल भेजनी चाहिए, या आपके message का इंतज़ार करना चाहिए?",
        explanation: {
          "hi-Deva": "यह दो options check करता है: notebook भेजना या message का wait करना।",
          "hi-Latn": "Yeh do options check karta hai: notebook bhejna ya message ka wait karna.",
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the follow-up question.",
        incorrectSentence: "I send notebook tomorrow or wait message?",
        options: [
          "Should I send the notebook tomorrow, or should I wait for your message?",
          "I send notebook tomorrow or wait message?",
          "Tomorrow notebook should wait message?",
        ],
        answer: "Should I send the notebook tomorrow, or should I wait for your message?",
        explanation: {
          "hi-Deva": "'Should I...' सलाह या instruction check करने के लिए सही start है।",
          "hi-Latn": "'Should I...' advice ya instruction check karne ke liye sahi start hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the clarification request.",
        words: ["Could", "you", "explain", "the", "last", "step", "again?"],
        answer: ["Could", "you", "explain", "the", "last", "step", "again?"],
        explanation: {
          "hi-Deva": "'Could you explain...' किसी instruction को दोबारा समझने का polite तरीका है।",
          "hi-Latn": "'Could you explain...' kisi instruction ko dobara samajhne ka polite tareeka hai.",
        },
      },
      {
        type: "speak",
        prompt: "Ask for clarification clearly.",
        sentence: {
          id: "explain-last-step-again",
          targetLanguage: "en-IN",
          targetText: "Could you explain the last step again?",
          support: {
            "hi-Deva": "क्या आप आखिरी step फिर से समझा सकते हैं?",
            "hi-Latn": "Kya aap last step phir se samjha sakte hain?",
          },
        },
      },
    ],
  },
  {
    id: "summarize-service-problem",
    moduleId: "confident-community-conversations",
    title: "Summarize A Service Problem",
    durationMinutes: 10,
    overview:
      "You will practice giving a clear problem summary with time, action already taken, and the help you need next.",
    skipOverview: [
      "Summarizing a problem in two connected sentences",
      "Mentioning what you have already tried",
      "Asking for a clear next action",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Summarize the problem and previous action.",
        sentence: {
          id: "fridge-not-cooling-since-morning",
          targetLanguage: "en-IN",
          targetText: "The fridge has not been cooling since morning, and I have already switched it off and on.",
          support: {
            "hi-Deva": "Fridge सुबह से cooling नहीं कर रहा है, और मैंने इसे पहले ही off और on करके देखा है।",
            "hi-Latn": "Fridge subah se cooling nahi kar raha hai, aur maine ise pehle hi off aur on karke dekha hai.",
          },
          notes: {
            "hi-Deva": "'Already' बताता है कि आपने एक कोशिश पहले कर ली है।",
            "hi-Latn": "'Already' batata hai ki aapne ek koshish pehle kar li hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask for the next action clearly.",
        sentence: {
          id: "please-send-technician-today",
          targetLanguage: "en-IN",
          targetText: "Could you please send a technician today, or tell me what I should do next?",
          support: {
            "hi-Deva": "क्या आप कृपया आज technician भेज सकते हैं, या मुझे बता सकते हैं कि आगे क्या करना चाहिए?",
            "hi-Latn": "Kya aap please aaj technician bhej sakte hain, ya mujhe bata sakte hain ki aage kya karna chahiye?",
          },
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of this problem summary.",
        sentence: {
          id: "fridge-not-cooling-meaning",
          targetLanguage: "en-IN",
          targetText: "The fridge has not been cooling since morning, and I have already switched it off and on.",
          support: {
            "hi-Deva": "Fridge सुबह से cooling नहीं कर रहा है, और मैंने इसे पहले ही off और on करके देखा है।",
            "hi-Latn": "Fridge subah se cooling nahi kar raha hai, aur maine ise pehle hi off aur on karke dekha hai.",
          },
        },
        options: [
          "Fridge सुबह से cooling नहीं कर रहा है, और मैंने इसे पहले ही off और on करके देखा है।",
          "मैंने आज बाजार से सब्जी खरीदी।",
          "Teacher ने notebook कल भेजने को कहा।",
        ],
        answer: "Fridge सुबह से cooling नहीं कर रहा है, और मैंने इसे पहले ही off और on करके देखा है।",
        explanation: {
          "hi-Deva": "यह sentence problem, time, और आपने क्या try किया, तीनों बताता है।",
          "hi-Latn": "Yeh sentence problem, time, aur aapne kya try kiya, teeno batata hai.",
        },
      },
      {
        type: "fillBlank",
        prompt: "Choose the word that shows previous action.",
        sentenceStart: "I have ",
        sentenceEnd: " switched it off and on.",
        options: ["already", "between", "instead"],
        answer: "already",
        explanation: {
          "hi-Deva": "'Already' बताता है कि काम पहले हो चुका है।",
          "hi-Latn": "'Already' batata hai ki kaam pehle ho chuka hai.",
        },
      },
      {
        type: "choice",
        prompt: "Which sentence asks for help and a backup next step?",
        options: [
          "Could you please send a technician today, or tell me what I should do next?",
          "Technician today send or next what?",
          "You send technician now only.",
        ],
        answer: "Could you please send a technician today, or tell me what I should do next?",
        explanation: {
          "hi-Deva": "यह request दो useful options देती है: technician भेजना या next step बताना।",
          "hi-Latn": "Yeh request do useful options deti hai: technician bhejna ya next step batana.",
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the problem summary.",
        incorrectSentence: "Fridge not cooling since morning and I already off on.",
        options: [
          "The fridge has not been cooling since morning, and I have already switched it off and on.",
          "Fridge not cooling since morning and I already off on.",
          "Since morning fridge not cooling I off on already.",
        ],
        answer: "The fridge has not been cooling since morning, and I have already switched it off and on.",
        explanation: {
          "hi-Deva": "Problem summary में पूरा structure helpful है: problem, time, और action already taken।",
          "hi-Latn": "Problem summary mein poora structure helpful hai: problem, time, aur action already taken.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the summary sentence.",
        words: ["The", "main", "problem", "is", "that", "the", "fridge", "is", "not", "cooling."],
        answer: ["The", "main", "problem", "is", "that", "the", "fridge", "is", "not", "cooling."],
        explanation: {
          "hi-Deva": "'The main problem is that...' summary शुरू करने का clear तरीका है।",
          "hi-Latn": "'The main problem is that...' summary shuru karne ka clear tareeka hai.",
        },
      },
      {
        type: "speak",
        prompt: "Summarize the issue in one clear sentence.",
        sentence: {
          id: "main-problem-fridge-not-cooling",
          targetLanguage: "en-IN",
          targetText: "The main problem is that the fridge is not cooling.",
          support: {
            "hi-Deva": "मुख्य समस्या यह है कि fridge cooling नहीं कर रहा है।",
            "hi-Latn": "Main problem yeh hai ki fridge cooling nahi kar raha hai.",
          },
        },
      },
    ],
  },
  {
    id: "community-decision-discussion",
    moduleId: "confident-community-conversations",
    title: "Discuss A Community Decision",
    durationMinutes: 10,
    overview:
      "You will practice joining a longer community discussion, asking follow-up questions, and summarizing a fair decision.",
    skipOverview: [
      "Giving a balanced opinion in a group",
      "Asking follow-up questions before deciding",
      "Summarizing the final decision respectfully",
    ],
    activities: [
      {
        type: "sentence",
        prompt: "Give a balanced opinion in a society discussion.",
        sentence: {
          id: "agree-repair-important-budget",
          targetLanguage: "en-IN",
          targetText: "I agree that the repair is important, but we should check the budget before we approve it.",
          support: {
            "hi-Deva": "मैं मानती हूँ कि repair ज़रूरी है, लेकिन approve करने से पहले हमें budget check करना चाहिए।",
            "hi-Latn": "Main maanti hoon ki repair zaroori hai, lekin approve karne se pehle humein budget check karna chahiye.",
          },
          notes: {
            "hi-Deva": "यह sentence agreement और caution दोनों को politely जोड़ता है।",
            "hi-Latn": "Yeh sentence agreement aur caution dono ko politely jodta hai.",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Ask for more details before deciding.",
        sentence: {
          id: "can-you-share-two-estimates",
          targetLanguage: "en-IN",
          targetText: "Can you share two estimates so that we can compare the cost and quality?",
          support: {
            "hi-Deva": "क्या आप दो estimates share कर सकते हैं ताकि हम cost और quality compare कर सकें?",
            "hi-Latn": "Kya aap do estimates share kar sakte hain taaki hum cost aur quality compare kar saken?",
          },
        },
      },
      {
        type: "sentence",
        prompt: "Summarize the group decision.",
        sentence: {
          id: "final-decision-after-estimates",
          targetLanguage: "en-IN",
          targetText: "So the final decision is to collect two estimates and discuss them in the next meeting.",
          support: {
            "hi-Deva": "तो final decision यह है कि दो estimates collect करके उन्हें अगली meeting में discuss किया जाएगा।",
            "hi-Latn": "To final decision yeh hai ki do estimates collect karke unhe agli meeting mein discuss kiya jayega.",
          },
        },
      },
      {
        type: "choice",
        prompt: "Which sentence gives a balanced opinion?",
        options: [
          "I agree that the repair is important, but we should check the budget before we approve it.",
          "Repair important approve now no budget.",
          "I agree so no need to check anything.",
        ],
        answer: "I agree that the repair is important, but we should check the budget before we approve it.",
        explanation: {
          "hi-Deva": "Balanced opinion में आप repair की importance मानती हैं और budget check करने की बात भी रखती हैं।",
          "hi-Latn": "Balanced opinion mein aap repair ki importance maanti hain aur budget check karne ki baat bhi rakhti hain.",
        },
      },
      {
        type: "fillBlank",
        prompt: "Choose the phrase that shows purpose.",
        sentenceStart: "Can you share two estimates ",
        sentenceEnd: " we can compare the cost and quality?",
        options: ["so that", "but that", "since yesterday"],
        answer: "so that",
        explanation: {
          "hi-Deva": "'So that' purpose बताता है: estimates इसलिए चाहिए ताकि comparison हो सके।",
          "hi-Latn": "'So that' purpose batata hai: estimates isliye chahiye taaki comparison ho sake.",
        },
      },
      {
        type: "chooseMeaning",
        prompt: "Choose the meaning of the final decision.",
        sentence: {
          id: "final-decision-estimates-meaning",
          targetLanguage: "en-IN",
          targetText: "So the final decision is to collect two estimates and discuss them in the next meeting.",
          support: {
            "hi-Deva": "तो final decision यह है कि दो estimates collect करके उन्हें अगली meeting में discuss किया जाएगा।",
            "hi-Latn": "To final decision yeh hai ki do estimates collect karke unhe agli meeting mein discuss kiya jayega.",
          },
        },
        options: [
          "तो final decision यह है कि दो estimates collect करके उन्हें अगली meeting में discuss किया जाएगा।",
          "आज dinner आठ बजे रखा जाएगा।",
          "Notebook कल teacher को भेजनी है।",
        ],
        answer: "तो final decision यह है कि दो estimates collect करके उन्हें अगली meeting में discuss किया जाएगा।",
        explanation: {
          "hi-Deva": "यह sentence meeting का निर्णय summarize करता है।",
          "hi-Latn": "Yeh sentence meeting ka decision summarize karta hai.",
        },
      },
      {
        type: "fixSentence",
        prompt: "Fix the follow-up question.",
        incorrectSentence: "You share two estimates compare cost quality?",
        options: [
          "Can you share two estimates so that we can compare the cost and quality?",
          "You share two estimates compare cost quality?",
          "Two estimates can compare you share quality cost?",
        ],
        answer: "Can you share two estimates so that we can compare the cost and quality?",
        explanation: {
          "hi-Deva": "'So that we can...' reason और purpose को पूरा बनाता है।",
          "hi-Latn": "'So that we can...' reason aur purpose ko poora banata hai.",
        },
      },
      {
        type: "arrangeWords",
        prompt: "Arrange the meeting summary.",
        words: ["Let", "me", "summarize", "the", "decision", "for", "everyone."],
        answer: ["Let", "me", "summarize", "the", "decision", "for", "everyone."],
        explanation: {
          "hi-Deva": "'Let me summarize...' group में बात को close करने का polite तरीका है।",
          "hi-Latn": "'Let me summarize...' group mein baat ko close karne ka polite tareeka hai.",
        },
      },
      {
        type: "speak",
        prompt: "Close the discussion clearly.",
        sentence: {
          id: "let-me-summarize-decision",
          targetLanguage: "en-IN",
          targetText: "Let me summarize the decision for everyone.",
          support: {
            "hi-Deva": "मुझे सबके लिए decision summarize करने दीजिए।",
            "hi-Latn": "Mujhe sabke liye decision summarize karne dijiye.",
          },
        },
      },
    ],
  },
];

export function getLesson(lessonId: string) {
  return lessons.find((lesson) => lesson.id === lessonId);
}
