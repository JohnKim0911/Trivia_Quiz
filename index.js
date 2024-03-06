import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3001;
var triviaAPI;
var quizList;
var quizIndex;
var score;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.post("/setDifficulty", (req, res) => {
    quizIndex = 0;
    score = 0;
    var difficulty = req.body.difficulty;
    console.log("difficulty: " + difficulty);
    triviaAPI = `https://opentdb.com/api.php?amount=10&category=20&difficulty=${difficulty}&type=multiple`;
    // console.log(triviaAPI);
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
        console.log(error);
    };
});

app.get("/quiz", (req, res) => {
    if (quizIndex < quizList.length ) {
        var currentQuiz = quizList[quizIndex];
        res.render("quiz.ejs", { quiz: currentQuiz, quizLength:quizList.length });
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
    console.log("currentQuiz.id:"+ currentQuiz.id + ", userAnswer:" + userAnswer + ", isCorrect:" + currentQuiz.isCorrect);

    if (isCorrect) {
        score++;
        res.render("answer.ejs", { quiz: currentQuiz, quizLength: quizList.length, isCorrect: isCorrect });
    } else {
        res.render("answer.ejs", { quiz: currentQuiz, quizLength: quizList.length, isCorrect: isCorrect, userAnswer: userAnswer });
    };
});

app.get("/result", (req, res) => {
    console.log(quizList);
    res.render("result.ejs", { score: score, quizList: quizList });
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// ------------------------------------- Functions -------------------------------------
function createQuizList (rawQuizdata) {
    var quizList = [];
    for (var i = 0; i < rawQuizdata.length; i++) {
        var choicesList = createChoiceList(rawQuizdata[i].incorrect_answers, rawQuizdata[i].correct_answer);
        var newData = {
            "id": i + 1,
            "question": rawQuizdata[i].question,
            "choices": choicesList,
            "answer": rawQuizdata[i].correct_answer,
        };
        quizList.push(newData);
    };
    
    return quizList;
};

function createChoiceList (incorrect_answers_list, correct_answer_string) {
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
}


