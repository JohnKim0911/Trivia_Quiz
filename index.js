import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import HtmlEntities from 'html-entities';

const app = express();
const port = 3000;

var categoryNum;
var triviaAPI;
var quizList;
var quizIndex;
var score;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.post("/chooseCategory", (req, res) => {
    quizIndex = 0;
    score = 0;
    categoryNum = req.body.category;
    console.log(getCategoryName(categoryNum));
    res.redirect("difficulty");
});

app.get("/difficulty", (req, res) => {
    res.render("difficulty.ejs");
});

app.post("/setDifficulty", (req, res) => {
    var difficulty = req.body.difficulty;
    console.log("difficulty: " + difficulty);
    triviaAPI = `https://opentdb.com/api.php?amount=10&category=${categoryNum}&difficulty=${difficulty}&type=multiple`;
    res.redirect("getQuizData");
});

app.get("/getQuizData", async (req, res) => {
    try {
        const response = await axios.get(triviaAPI);
        quizList = createQuizList(response.data.results);
        console.log(quizList);
        res.redirect("/quiz");
    } catch (error) {
        res.status(500);
        console.log(error.response);
    };
});

app.get("/quiz", (req, res) => {
    if (quizIndex < quizList.length) {
        var currentQuiz = quizList[quizIndex];
        res.render("quiz.ejs", { quiz: currentQuiz, quizLength: quizList.length });
    } else {
        res.redirect("/result");
    };
});

app.post("/answer", (req, res) => {
    var userAnswer = req.body.choice;
    var isCorrect = isCorrectAnswer(userAnswer);
    var currentQuiz = quizList[quizIndex++];
    currentQuiz["userAnswer"] = userAnswer;
    currentQuiz["isCorrect"] = isCorrect;
    console.log("currentQuiz.id:" + currentQuiz.id + ", userAnswer:" + userAnswer + ", isCorrect:" + currentQuiz.isCorrect);

    if (isCorrect) {
        score++;
        res.render("answer.ejs", { quiz: currentQuiz, quizLength: quizList.length, isCorrect: isCorrect });
    } else {
        res.render("answer.ejs", { quiz: currentQuiz, quizLength: quizList.length, isCorrect: isCorrect, userAnswer: userAnswer });
    };
});

app.get("/result", (req, res) => {
    console.log("score: " + score);
    res.render("result.ejs", { score: score, quizLength: quizList.length });
});

app.get("/detailResult", (req, res) => {
    console.log(quizList);
    res.render("detailResult.ejs", { score: score, quizList: quizList });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// ------------------------------------- Functions -------------------------------------
function decodeHTMLEntities(encodedString) {
    return HtmlEntities.decode(encodedString);
};

function createQuizList(rawQuizdata) {
    var quizList = [];
    for (var i = 0; i < rawQuizdata.length; i++) {
        var choicesList = createChoiceList(rawQuizdata[i].incorrect_answers, rawQuizdata[i].correct_answer);
        var newData = {
            "id": i + 1,
            "question": decodeHTMLEntities(rawQuizdata[i].question),
            "choices": choicesList.map(decodeHTMLEntities),
            "answer": decodeHTMLEntities(rawQuizdata[i].correct_answer),
        };
        quizList.push(newData);
    };
    return quizList;
};

function createChoiceList(incorrect_answers_list, correct_answer_string) {
    var choiceList = incorrect_answers_list;
    var randomIndex = Math.floor(Math.random() * 4);  // 0~3
    choiceList.splice(randomIndex, 0, correct_answer_string);  // insert correct answer somewhere
    return choiceList;
};

function isCorrectAnswer(userAnswer) {
    var currentQuiz = quizList[quizIndex];
    if (userAnswer == currentQuiz.answer) {
        return true;
    } else {
        return false;
    }
};

function getCategoryName(categoryNum) {
    const category = {
        9: "General Knowledge",
        20: "Mythology",
        21: "Sports",
        22: "Geography",
        23: "History",
        24: "Politics",
        25: "Art",
        26: "Celebrities",
        27: "Animals",
        28: "Vehicles",
        17: "Science & Nature",
        18: "Computers",
        19: "Mathematics",
        30: "Gadgets",
        10: "Books",
        11: "Film",
        12: "Music",
        13: "Musicals & Theatres",
        14: "Television",
        15: "Video Games",
        16: "Board Games",
        29: "Comics",
        31: "Japanese Anime & Manga",
        32: "Cartoon & Animations",
    };
    return `category: ${categoryNum}. ${category[categoryNum]}`;
};