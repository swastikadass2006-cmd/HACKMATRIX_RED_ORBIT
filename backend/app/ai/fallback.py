def template_warning(reasons, lang):

    messages = {
        "en": {
            "headline": "Suspicious Payment Detected",
            "message": "This transaction has unusual activity.",
            "actions": [
                "Verify the recipient.",
                "Do not share your UPI PIN.",
                "Cancel if you feel unsafe."
            ]
        },

        "hi": {
            "headline": "संदिग्ध भुगतान मिला",
            "message": "इस लेन-देन में असामान्य गतिविधि है।",
            "actions": [
                "प्राप्तकर्ता की जांच करें।",
                "अपना UPI PIN साझा न करें।",
                "असुरक्षित महसूस होने पर भुगतान रद्द करें।"
            ]
        },

        "bn": {
            "headline": "সন্দেহজনক পেমেন্ট শনাক্ত হয়েছে",
            "message": "এই লেনদেনে অস্বাভাবিক কার্যকলাপ রয়েছে।",
            "actions": [
                "প্রাপকের পরিচয় যাচাই করুন।",
                "আপনার UPI PIN শেয়ার করবেন না।",
                "অনিরাপদ মনে হলে পেমেন্ট বাতিল করুন।"
            ]
        }
    }

    data = messages.get(lang, messages["en"])

    return {
        "headline": data["headline"],
        "message": data["message"],
        "do_this_now": data["actions"],
        "language": lang
    }