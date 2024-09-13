// load the express package in the express variable
const express = require("express");

// import the built-in fs (File System) module and assign it to the fs constant
// fs is used to perform various file operations such as reading, writing, updating, and deleting files
const fs = require("fs");

// load sqlite3
const sqlite3 = require("sqlite3");

// define the port
const port = 8080;

// create a web application
const app = express();

// define the public directory as 'static'
app.use(express.static("public"));

// define the default " / " route
app.get(`/`, (req, res) => {
  console.log("I recieved a new request, so I am sending back the response");
  res.send("This is the way");
});

// create a new route to send back an HTML file
app.get(`/medhub`, (req, res) => {
  res.sendFile(__dirname + `/views/medhub.html`);
});

// make the server listen to connections
app.listen(port, function () {
  console.log("The server is listening on port " + port + "...");
  // The same thing written with backsticks looks like this:
  // console.log(`The server is listening on port ${port}...`);
});

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
