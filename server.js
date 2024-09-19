// ----- PACKAGES -----
// load the express package in the express variable
const express = require("express");
// import the built-in fs (File System) module and assign it to the fs constant
// fs is used to perform various file operations such as reading, writing, updating, and deleting files
const fs = require("fs");
// load sqlite3
const sqlite3 = require("sqlite3");
// load the handlebars for express
const { engine } = require("express-handlebars");

// ----- APPLICATION -----
// create a web application
const app = express();

// ----- PORT -----
// define the port
const port = 8080;

// JSON OBJECT
//
//
//
//
const patient = [
  {
    patid: "1",
    fname: "Erik",
    lname: "Svensson",
    age: 45,
    gender: "Male",
    phone: "+46 70 123 4567",
    contact: "Storgatan 12, 55321 Jönköping",
  },
  {
    patid: "2",
    fname: "Anna",
    lname: "Karlsson",
    age: 72,
    gender: "Female",
    phone: "+46 70 234 5678",
    contact: "Huskvarnavägen 45, 56132 Huskvarna",
  },
  {
    patid: "3",
    fname: "Lars",
    lname: "Johansson",
    age: 66,
    gender: "Male",
    phone: "+46 70 345 6789",
    contact: "Vättergatan 9, 56432 Bankeryd",
  },
  {
    patid: "4",
    fname: "Maria",
    lname: "Nilsson",
    age: 28,
    gender: "Female",
    phone: "+46 70 456 7890",
    contact: "Bäckalyckevägen 67, 55335 Jönköping",
  },
  {
    patid: "5",
    fname: "Gustav",
    lname: "Eriksson",
    age: 54,
    gender: "Male",
    phone: "+46 70 567 8901",
    contact: "Norrahammarsvägen 8, 56231 Norrahammar",
  },
  {
    patid: "6",
    fname: "Sofia",
    lname: "Lindström",
    age: 39,
    gender: "Female",
    phone: "+46 70 678 9012",
    contact: "Visingsövägen 11, 56393 Gränna",
  },
  {
    patid: "7",
    fname: "Oskar",
    lname: "Berg",
    age: 76,
    gender: "Male",
    phone: "+46 70 789 0123",
    contact: "Råslättsvägen 21, 55334 Jönköping",
  },
  {
    patid: "8",
    fname: "Elin",
    lname: "Holm",
    age: 23,
    gender: "Female",
    phone: "+46 70 890 1234",
    contact: "Rosenlundsvägen 13, 56145 Huskvarna",
  },
  {
    patid: "9",
    fname: "Henrik",
    lname: "Fransson",
    age: 80,
    gender: "Male",
    phone: "+46 70 901 2345",
    contact: "Tabergsvägen 5, 56241 Taberg",
  },
  {
    patid: "10",
    fname: "Eva",
    lname: "Olsson",
    age: 90,
    gender: "Female",
    phone: "+46 70 912 3456",
    contact: "Korsgatan 7, 56789 Jönköping",
  },
  {
    patid: "11",
    fname: "Ingrid",
    lname: "Andersson",
    age: 56,
    gender: "Female",
    phone: "+46 70 923 4567",
    contact: "Storgatan 89, 56133 Huskvarna",
  },
  {
    patid: "12",
    fname: "Mats",
    lname: "Larsson",
    age: 36,
    gender: "Male",
    phone: "+46 70 934 5678",
    contact: "Lindvägen 20, 55332 Jönköping",
  },
];

const treatment = [
  {
    treatid: "1",
    description: "Routine check-up and consultation.",
    startdate: "2024-01-10",
    enddate: "2024-01-10",
    medname: "N/A",
    meddose: "N/A",
  },
  {
    treatid: "2",
    description: "Management of hypertension.",
    startdate: "2024-02-15",
    enddate: "2024-08-15",
    medname: "Lisinopril",
    meddose: "10 mg daily",
  },
  {
    treatid: "3",
    description: "Diabetes management and monitoring.",
    startdate: "2024-03-01",
    enddate: "2024-12-01",
    medname: "Metformin",
    meddose: "500 mg twice daily",
  },
  {
    treatid: "4",
    description: "Treatment for seasonal allergies.",
    startdate: "2024-04-01",
    enddate: "2024-09-01",
    medname: "Cetirizine",
    meddose: "10 mg daily",
  },
  {
    treatid: "5",
    description: "Osteoporosis management.",
    startdate: "2024-05-15",
    enddate: "2025-05-15",
    medname: "Alendronate",
    meddose: "70 mg weekly",
  },
  {
    treatid: "6",
    description: "Management of chronic migraine.",
    startdate: "2024-06-10",
    enddate: "2024-12-10",
    medname: "Topiramate",
    meddose: "25 mg daily",
  },
  {
    treatid: "7",
    description: "Heart disease management and monitoring.",
    startdate: "2024-07-05",
    enddate: "2025-07-05",
    medname: "Atorvastatin",
    meddose: "20 mg daily",
  },
  {
    treatid: "8",
    description: "Treatment for asthma.",
    startdate: "2024-08-20",
    enddate: "2024-11-20",
    medname: "Albuterol",
    meddose: "90 mcg inhaled every 4-6 hours as needed",
  },
  {
    treatid: "9",
    description: "Management of age-related macular degeneration.",
    startdate: "2024-09-15",
    enddate: "2025-09-15",
    medname: "Lucentis",
    meddose: "One injection every month",
  },
  {
    treatid: "10",
    description: "Management of arthritis pain.",
    startdate: "2024-10-10",
    enddate: "2025-10-10",
    medname: "Ibuprofen",
    meddose: "400 mg every 8 hours as needed",
  },
  {
    treatid: "11",
    description: "Treatment for chronic depression.",
    startdate: "2024-11-01",
    enddate: "2025-05-01",
    medname: "Sertraline",
    meddose: "50 mg daily",
  },
  {
    treatid: "12",
    description: "Management of high cholesterol.",
    startdate: "2024-12-01",
    enddate: "2025-12-01",
    medname: "Simvastatin",
    meddose: "40 mg daily",
  },
];

// ----- MIDDLEWARES -----
// define the public directory as 'static' making it public
app.use(express.static("public"));

// ----- HANDLEBARS -----
//initialize the engine to be handlebars
// The use of helpers: isEqual was adapted from stackoverflow
// Source: (Pablo Varando, 2018, "Handlebarsjs check if a string is equal to a value", https://stackoverflow.com/a/51976315)

app.engine(
  "handlebars",
  engine({
    helpers: {
      isEqual: function (a, b) {
        return a === b;
      },
    },
  })
);
// set handlebars as the view engine
app.set("view engine", "handlebars");
// define the views directory as ./views
app.set("views", "./views");

// ----- ROUTES -----
// define the default " / " route
app.get(`/`, (req, res) => {
  // to log each request of the "/" route
  //   console.log("I recieved a new request, so I am sending back the response");
  //   res.send("This is the way");
  res.render("home.handlebars");
});

app.get(`/patients`, (req, res) => {
  const patientData = { patient };
  res.render("patients.handlebars", patientData);
});

app.get(`/treatments`, (req, res) => {
  const treatmentData = { treatment };
  res.render("treatments.handlebars", treatmentData);
});

app.get(`/about`, (req, res) => {
  // not using the res.sendFile function
  //   res.sendFile(__dirname + `/views/medhub.html`);
  res.render("about.handlebars");
});

app.get(`/contact`, (req, res) => {
  res.render("contact.handlebars");
});

app.get("/fika", (req, res) => {
  res.sendStatus(418);
});

// ----- LISTEN -----
// make the server listen to connections
app.listen(port, function () {
  console.log("The server is listening on port " + port + "...");
  // The same thing written with backsticks looks like this:
  // console.log(`The server is listening on port ${port}...`);
});

//
//
//

/* THIS IS PART OF ONE OF THE EXERCISES */
/*
/*
/*
/* START */

const dbFile = "test-data.sqlite3.db";
db = new sqlite3.Database(dbFile);

/* BELOW PART IS COMMENTED OUT, BECAUSE THE DATABASE WAS CREATED THE FIRST TIME THE CODE WAS RUN

// creates table projects at startup
db.run(
  "CREATE TABLE Person (pid INTEGER PRIMARY KEY, fname TEXT NOT NULL, lname TEXT NOT NULL, age INTEGER, email TEXT)",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("---> ERROR: ", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table created!");
      db.run(
        "INSERT INTO Person (fname, lname, age, email) VALUES ('John', 'Smith', 25, 'john.smith@example.com'), ('Jane', 'Doe', 30, 'jane.doe@mail.com'), ('Alex', 'Johnson', 40, 'alex.johnson@company.com'), ('Emily', 'Brown', 35, 'emily.brown@business.org'), ('Michael', 'Davis', 50, 'michael.davis@email.net'), ('Sarah', 'Miller', 28, 'sarah.miller@example.com'), ('David', 'Garcia', 45, 'david.garcia@mail.com'), ('Laura', 'Rodriguez', 32, 'laura.rodriguez@company.com'), ('Chris', 'Wilson', 27, 'chris.wilson@business.org'), ('Anna', 'Martinez', 22, 'anna.martinez@email.net'), ('James', 'Taylor', 53, 'james.taylor@example.com'), ('Patricia', 'Anderson', 44, 'patricia.anderson@mail.com'), ('Robert', 'Thomas', 38, 'robert.thomas@company.com'), ('Linda', 'Hernandez', 55, 'linda.hernandez@business.org'), ('William', 'Moore', 26, 'william.moore@email.net'), ('Barbara', 'Jackson', 37, 'barbara.jackson@example.com'), ('Richard', 'White', 49, 'richard.white@mail.com'), ('Susan', 'Lee', 24, 'susan.lee@company.com'), ('Joseph', 'Clark', 41, 'joseph.clark@business.org'), ('Jessica', 'Walker', 29, 'jessica.walker@email.net');",
        function (err) {
          if (err) {
            console.log(err.message);
          } else {
            console.log("---> Rows inserted in the table Person.");
          }
        }
      );
    }
  }
);

*/

app.get("/rawpersons", function (req, res) {
  db.all("SELECT * FROM Person", function (err, rawPersons) {
    if (err) {
      console.log("Error: " + err);
    } else {
      console.log("Data found, sending it back to the client...");
      res.send(rawPersons);
    }
  });
});

app.get("/listpersons", function (req, res) {
  db.all("SELECT * FROM Person", function (err, rawPersons) {
    if (err) {
      console.log("Error: " + err);
    } else {
      listPersonsHTML = "<ul>";
      rawPersons.forEach(function (onePerson) {
        listPersonsHTML += "<li>";
        // here, we need to use backticks!
        listPersonsHTML += `${onePerson.fname}, `;
        listPersonsHTML += `${onePerson.lname}, `;
        listPersonsHTML += `${onePerson.age} years old, `;
        listPersonsHTML += `${onePerson.email}`;
        listPersonsHTML += "</li>";
      });
      listPersonsHTML += "</ul>";
      // This console.log is used to test what the js code is creating in the html
      //   console.log(listPersonsHTML);
      res.send(listPersonsHTML);
    }
  });
});

/* THIS IS PART OF ONE OF THE EXERCISES */
/*
/*
/*
/* END */
