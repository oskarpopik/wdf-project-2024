// ----- GLOBAL DEFINITIONS
const adminName = "admin";
// password before hashing
// const adminPassword = "I<3LicensePlates!";
const adminPassword =
  "$2b$14$HDqipYjU45DFd6ZjG0G0t.398Mqk58gqeFdLIc0dlh6y.PcvZlmlS";

// ----- PACKAGES -----
// ----- BCRYPT -----
const bcrypt = require("bcrypt");
// salting round for the bcrypt algorithm
const saltRounds = 14;

// run this code to generated a hashed password
// bcrypt.hash(adminPassword, saltRounds, function (err, hash) {
//   if (err) {
//     console.log("---> Error while encrypting the password: ", err);
//   } else {
//     console.log("---> Hashed password generated: ", hash);
//   }
// });

// load the express package in the express variable
const express = require("express");
// import the built-in fs (File System) module and assign it to the fs constant
// fs is used to perform various file operations such as reading, writing, updating, and deleting files
const fs = require("fs");
// load sqlite3
const sqlite3 = require("sqlite3");
// load the handlebars for express
const { engine } = require("express-handlebars");
// load sessions in express
const session = require("express-session");
// store sessions in a SQLite3 database file
const connectSqlite3 = require("connect-sqlite3");
const { log } = require("console");

// NOT USED ANYMORE:
// required to get data from POST forms
// const bodyParser = require("body-parser");

// ----- APPLICATION -----
// create a web application
const app = express();

// ----- PORT -----
// define the port
const port = 8080;

// ----- DATABASE -----
const dbFile = "medhub-db.sqlite3.db";
const db = new sqlite3.Database(dbFile);

// ----- SESSIONS ----
// store sessions in a database
const SQLiteStore = connectSqlite3(session);

// define the session
app.use(
  session({
    store: new SQLiteStore({ db: "session-db.db" }),
    // sessions won't be saved to the store unless they are modified
    saveUninitialized: false,
    // Prevents saving session back to the store if the session data hasn't changed during the request
    resave: false,
    secret: "ThisH3r3IsAGr8S3cret&IAmN0tT3llingA1Soul",
  })
);
app.use(function (req, res, next) {
  console.log("Session passed to response locals...");
  res.locals.session = req.session;
  next();
});

// ----- MIDDLEWARES -----
// define the public directory as 'static' making it public
app.use(express.static("public"));
// allows express middleware for processing forms sent using the "post" method
// true: parsing more complex, nested data structures
// false: supports simpler, flat key-value pairs
app.use(express.urlencoded({ extended: true }));

// ----- HANDLEBARS -----
//initialize the engine to be handlebars

app.engine(
  "handlebars",
  engine({
    helpers: {
      // The use of helpers: isEqual was adapted from stackoverflow
      // Source: (Pablo Varando, 2018, "Handlebarsjs check if a string is equal to a value", https://stackoverflow.com/a/51976315)
      isEqual: function (a, b) {
        return a === b;
      },
      // The use of add and subtract helpers to help with pagination was suggested by ChatGPT
      // The following 12 lines of code were adapted from ChatGTP https://chatgpt.com/share/66ffceef-952c-800b-ad3a-da3c820b91b8 Accessed: 2024-10-04
      add: function (a, b) {
        return a + b;
      },
      subtract: function (a, b) {
        return a - b;
      },
      gt: function (a, b) {
        return a > b;
      },
      lt: function (a, b) {
        return a < b;
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
  const userSessionModel = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  console.log("---> Home model: " + JSON.stringify(userSessionModel));
  res.render("home.handlebars", userSessionModel);
});

app.get(`/patients`, (req, res) => {
  // getting data directly from a JSON object variable
  // const patientData = { patient };

  // getting data from SQLite database
  db.all("SELECT * FROM patient", (error, listOfPatients) => {
    if (error) {
      // display an error in the terminal
      console.log("ERROR: ", error);
    } else {
      // declare patientData as a local variable
      const patientData = { patient: listOfPatients };
      res.render("patients.handlebars", patientData);
    }
  });
});

// create a new route to sent back information on one specific patient
app.get("/patients/:patientid", (req, res) => {
  console.log(
    "Patient route parameter patientid: " + JSON.stringify(req.params.patientid)
  );
  // select in the table the patient with a given id
  db.get(
    "SELECT * FROM patient WHERE pid=?",
    [req.params.patientid],
    (error, thePatient) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        const patientIdData = { patient: thePatient };
        res.render("patient.handlebars", patientIdData);
      }
    }
  );
});

app.get(`/treatments`, (req, res) => {
  // getting data directly from a JSON object variable
  // const treatmentData = { treatment };

  // ADDING PAGINATION TO THE TREATMENTS

  // getting current page number and ensuring the page is an integer and set default page to 1
  const currentPage = parseInt(req.query.page) || 1;
  // limit the ammount of treatments displayed
  const limit = 3;
  // calculate the starting index for each page
  const offset = (currentPage - 1) * limit;

  // The following 19 lines of code were adapted from ChatGTP https://chatgpt.com/share/66ffceef-952c-800b-ad3a-da3c820b91b8 Accessed: 2024-10-04
  // calculate the total number of treatments
  const sqlNumOfTreatments = `SELECT count(*) AS total from treatment`;

  db.get(sqlNumOfTreatments, [], (error, countTreatments) => {
    if (error) {
      console.log("ERROR: ", error);
      return res
        .status(500)
        .send("Error while counting the number of treatments");
    }

    // total number of treatments in the db
    const totalTreatments = countTreatments.total;
    // console.log("The total number of treatments: " + totalTreatments);

    // total number of pages rendered rounded to the nearest integer
    const totalPages = Math.ceil(totalTreatments / limit);
    // console.log("The total number of pages: " + totalPages);

    const sqlTreatmentTable = `SELECT treatment.*,
    patient.pfname AS pat_fname,
    patient.plname AS pat_lname,
    doctor.dfname AS doc_fname,
    doctor.dlname AS doc_lname
    FROM treatment
    INNER JOIN patient ON treatment.pid = patient.pid 
    INNER JOIN doctor ON treatment.did = doctor.did
    LIMIT ? OFFSET ?`;

    // geting data from SQLite database
    db.all(sqlTreatmentTable, [limit, offset], (error, listOfTreatments) => {
      if (error) {
        // display an error in the terminal
        console.log("ERROR: ", error);
        return res.status(500).send("Error showing treatments with pagination");
      } else {
        // declare treatmentData as a local variable
        const treatmentData = {
          treatment: listOfTreatments,
          currentPage: currentPage,
          totalTreatments: totalTreatments,
          totalPages: totalPages,
        };
        res.render("treatments.handlebars", treatmentData);
      }
    });
  });
});

// create a new treatment
// The following 19 lines of code were adapted from ChatGTP https://chatgpt.com/share/66fe5921-be8c-800b-8278-dc2138f42d73 Accessed: 2024-10-03
app.get("/treatments/new", (req, res) => {
  // fetch patients and doctors from the database
  const sqlPatientTable = "SELECT pid, pfname, plname FROM patient";
  const sqlDoctorTable = "SELECT did, dfname, dlname FROM doctor";

  db.all(sqlPatientTable, (error, patients) => {
    if (error) {
      return res.status(500).send("Error fetching patients.");
    }

    db.all(sqlDoctorTable, (error, doctors) => {
      if (error) {
        return res.status(500).send("Error fetching doctors.");
      }
      // use patients and doctors data in the form view
      res.render("treatment-new.handlebars", { patients, doctors });
    });
  });
});

// pre-fill the form to modify a treatment according to its id
// The following 37 lines of code were adapted from ChatGTP https://chatgpt.com/share/66fe5921-be8c-800b-8278-dc2138f42d73 Accessed: 2024-10-03
app.get("/treatments/modify/:treatmentid", (req, res) => {
  const treatid = req.params.treatmentid;
  // fetch patients and doctors from the database
  const sqlPatientTable = "SELECT pid, pfname, plname FROM patient";
  const sqlDoctorTable = "SELECT did, dfname, dlname FROM doctor";

  db.get(
    "SELECT * FROM treatment WHERE tid=?",
    [treatid],
    (error, theTreatment) => {
      if (error) {
        console.log("ERROR: ", error);
        return res.redirect("/treatments");
      }

      // fetch patient and doctor to populate the select inputs
      db.all(sqlPatientTable, (error, patients) => {
        if (error) {
          return res.status(500).send("Error fetching patients.");
        }

        db.all(sqlDoctorTable, (error, doctors) => {
          if (error) {
            return res.status(500).send("Error fetching doctors.");
          }

          // use treatment, patient, and doctor data to the form view
          res.render("treatment-new.handlebars", {
            treatment: theTreatment,
            patients,
            doctors,
          });
        });
      });
    }
  );
});

// create a new route to sent back information on one specific treatment
app.get("/treatments/:treatmentid", (req, res) => {
  console.log(
    "Treatment route parameter treatmentid: " +
      JSON.stringify(req.params.treatmentid)
  );
  // select in the table the treatment with a given id
  db.get(
    `SELECT treatment.*,
    patient.pfname AS pat_fname,
    patient.plname AS pat_lname,
    doctor.dfname AS doc_fname,
    doctor.dlname AS doc_lname
    FROM treatment 
    INNER JOIN patient ON treatment.pid = patient.pid 
    INNER JOIN doctor ON treatment.did = doctor.did
    WHERE tid = ?`,
    [req.params.treatmentid],
    (error, theTreatment) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        const treatmentIdData = { treatment: theTreatment };
        res.render("treatment.handlebars", treatmentIdData);
      }
    }
  );
});

// delete one specific treatment
app.get("/treatments/delete/:treatmentid", (req, res) => {
  console.log(
    "Treatment route parameter treatmentid: " +
      JSON.stringify(req.params.treatmentid)
  );
  // delete a treatment with a given id in the treatment table
  db.run(
    "DELETE FROM treatment WHERE tid=?",
    [req.params.treatmentid],
    (error, theTreatment) => {
      if (error) {
        console.log("ERROR: " + error);
      } else {
        console.log(
          "The treatment " + req.params.treatmentid + " has been deleted!"
        );
        // redirect to the treatments list route
        res.redirect("/treatments");
      }
    }
  );
});

app.get(`/doctors`, (req, res) => {
  // geting data from SQLite database
  db.all("SELECT * FROM doctor", (error, listOfDoctors) => {
    if (error) {
      // display an error in the terminal
      console.log("ERROR: ", error);
    } else {
      // declare doctorData as a local variable
      const doctorData = { doctor: listOfDoctors };
      res.render("doctors.handlebars", doctorData);
    }
  });
});

// create a new route to sent back information on one specific docotor
app.get("/doctors/:doctorid", (req, res) => {
  console.log(
    "Doctor route parameter doctorid: " + JSON.stringify(req.params.doctorid)
  );
  // select in the table the doctor with a given id
  db.get(
    "SELECT * FROM doctor WHERE did=?",
    [req.params.doctorid],
    (error, theDoctor) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        const doctorIdData = { doctor: theDoctor };
        res.render("doctor.handlebars", doctorIdData);
      }
    }
  );
});

app.get(`/about`, (req, res) => {
  // not using the res.sendFile function
  //   res.sendFile(__dirname + `/views/medhub.html`);
  res.render("about.handlebars");
});

app.get(`/contact`, (req, res) => {
  res.render("contact.handlebars");
});

app.get(`/login`, (req, res) => {
  res.render("login.handlebars");
});

app.get(`/logout`, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Error while destroying the session: ", err);
    } else {
      console.log(`Logged out.`);
      res.redirect("/");
    }
  });
});

// ----- 418 ERROR
app.get("/fika", (req, res) => {
  res.status(418).render("418.handlebars");
});

// ----- 404 NOT FOUND
// the default 404 error
// app.use((req, res) => {
//   res.status(404).render("404.handlebars");
// });

// ----- 500 ERROR
// app.use((err, req, res, next) => {
// console.error(err.stack);
//   res.status(500).render("500.handlebars");
// });

// ----- LISTEN -----
// make the server listen to connections
app.listen(port, function () {
  // create the table with patients, doctors and treatments and fill it with data
  // initTablePatient(db);
  // initTableDoctor(db);
  // initTableTreatment(db);
  console.log("The server is listening on port " + port + "...");
  // The same thing written with backsticks looks like this:
  // console.log(`The server is listening on port ${port}...`);
});

app.post(`/login`, (req, res) => {
  // show the route
  // console.log("URL: ", req.url);

  // show the received POST data
  // const postData = JSON.stringify(req.body);
  // console.log("POST data: ", postData);

  const username = req.body.username;
  const password = req.body.password;

  // show GET results from the URL
  // console.log("Received login/password: " + username + " / " + password);

  // verification if the username and the password were provided
  if (!username || !password) {
    // build a model
    const loginErrorModel = {
      error: "Username and password are required to login.",
      message: "",
    };
    // send a response
    return res.status(400).render("login.handlebars", loginErrorModel);
  }

  // verification if the right username was provided
  if (username !== adminName) {
    console.log("Username was not admin");
    const loginWrongUserModel = {
      error: `Sorry, the username ${username} is not correct.`,
      message: "",
    };
    return res.status(400).render("login.handlebars", loginWrongUserModel);
  }

  // checking for admin credentials
  if (username === adminName) {
    console.log("The username is admin.");

    //   if (password === adminPassword) {
    //     console.log("The password for admin is correct.");
    //     const loginSuccessModel = {
    //       error: "",
    //       message: "Welcome home Mr Admin!",
    //     };
    //     res.render("login.handlebars", loginSuccessModel);
    //   } else {
    //     const loginWrongPassModel = { error: "Wrong password.", message: "" };
    //     res.status(400).render("login.handlebars", loginWrongPassModel);
    //   }
    // } else {
    //   const loginWrongUserModel = {
    //     error: `Sorry, the username ${username} is not correct.`,
    //     message: "",
    //   };
    //   res.status(400).render("login.handlebars", loginWrongUserModel);

    // checking for admin credentials with bcrypt
    bcrypt.compare(password, adminPassword, (err, result) => {
      if (err) {
        const loginCompPassModel = {
          error: "Error while comparing passwords: " + err,
          message: "",
        };
        return res.status(500).render("login.handlebars", loginCompPassModel);
      }

      if (result) {
        console.log("The password for admin is correct.");
        // SESSIONS
        // saves this login information in the session-db
        req.session.isAdmin = true;
        req.session.isLoggedIn = true;
        req.session.name = username;
        console.log("Session information: " + JSON.stringify(req.session));
        // redirect after login
        return res.redirect("/");

        // const loginSuccessModel = {
        //   error: "",
        //   message: "Welcome home Mr Admin!",
        // };
        // return res.render("login.handlebars", loginSuccessModel);
      } else {
        const loginWrongPassModel = { error: "Wrong password.", message: "" };
        return res.status(400).render("login.handlebars", loginWrongPassModel);
      }
    });
  }
});

// create a new treatment from the data sent in the form
app.post("/treatments/new", (req, res) => {
  const treatmentPatient = req.body.treatpat;
  const treatmentStart = req.body.treatstart;
  const treatmentEnd = req.body.treatend;
  const treatmentDesc = req.body.treatdesc;
  const treatmentMed = req.body.treatmedname;
  const treatmentDose = req.body.treatmeddose;
  const treatmentDoctor = req.body.treatdoc;

  db.run(
    `INSERT INTO treatment (pid, tstart, tend, tdesc, tmed, tdose, did) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      treatmentPatient,
      treatmentStart,
      treatmentEnd,
      treatmentDesc,
      treatmentMed,
      treatmentDose,
      treatmentDoctor,
    ],
    (error) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        console.log("Line added into the treatments table");
        res.redirect("/treatments");
      }
    }
  );
});

// update an existing treatment from the data sent in the form
app.post("/treatments/modify/:treatmentid", (req, res) => {
  // to get the treatment id
  const treatid = req.params.treatmentid;
  // to get all of information comming from the form
  const treatmentPatient = req.body.treatpat;
  const treatmentStart = req.body.treatstart;
  const treatmentEnd = req.body.treatend;
  const treatmentDesc = req.body.treatdesc;
  const treatmentMed = req.body.treatmedname;
  const treatmentDose = req.body.treatmeddose;
  const treatmentDoctor = req.body.treatdoc;

  db.run(
    `UPDATE treatment SET pid=?, tstart=?, tend=?, tdesc=?, tmed=?, tdose=?, did=? WHERE tid=?`,
    [
      treatmentPatient,
      treatmentStart,
      treatmentEnd,
      treatmentDesc,
      treatmentMed,
      treatmentDose,
      treatmentDoctor,
      treatid,
    ],
    (error) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        console.log("Line added into the treatments table");
        res.redirect("/treatments");
      }
    }
  );
});

// --------------------

// --------------------

// --------------------

// ----- FUNCTIONS -----
function initTablePatient(mydb) {
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

  // creates table of patients at startup
  mydb.run(
    "CREATE TABLE patient (pid INTEGER PRIMARY KEY, pfname TEXT NOT NULL, plname TEXT NOT NULL, page INTEGER, pgender TEXT NOT NULL, pcontact TEXT, pphone TEXT)",
    (error) => {
      if (error) {
        // tests error: display error
        console.log("---> ERROR: ", error);
      } else {
        // tests error: no error, the table has been created
        console.log("---> Table created!");

        // insert the patients
        patient.forEach((onePatient) => {
          mydb.run(
            "INSERT INTO patient (pid, pfname, plname, page, pgender, pcontact, pphone) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              onePatient.patid,
              onePatient.fname,
              onePatient.lname,
              onePatient.age,
              onePatient.gender,
              onePatient.phone,
              onePatient.contact,
            ],
            (error) => {
              if (error) {
                console.log("ERROR: ", error);
              } else {
                console.log("A line was added into the patient table");
              }
            }
          );
        });
      }
    }
  );
}

function initTableDoctor(mydb) {
  const doctor = [
    {
      docid: 1,
      fname: "John",
      lname: "Watson",
      specialization: "General Practice",
      email: "john.watson@rjl.se",
    },
    {
      docid: 2,
      fname: "Drake",
      lname: "Ramoray",
      specialization: "Neurology",
      email: "drake.ramoray@rjl.se",
    },
    {
      docid: 3,
      fname: "Leonard",
      lname: "McCoy",
      specialization: "Surgery",
      email: "leonard.mccoy@rjl.se",
    },
    {
      docid: 4,
      fname: "Michaela",
      lname: "Quinn",
      specialization: "Family Medicine",
      email: "michaela.quinn@rjl.se",
    },
    {
      docid: 5,
      fname: "Gregory",
      lname: "House",
      specialization: "Diagnostic Medicine",
      email: "gregory.house@rjl.se",
    },
    {
      docid: 6,
      fname: "John",
      lname: "Carter",
      specialization: "Emergency Medicine",
      email: "john.carter@rjl.se",
    },
    {
      docid: 7,
      fname: "Julius",
      lname: "Hibbert",
      specialization: "Pediatrics",
      email: "julius.hibbert@rjl.se",
    },
    {
      docid: 8,
      fname: "Nick",
      lname: "Rivera",
      specialization: "General Surgery",
      email: "nick.rivera@rjl.se",
    },
  ];

  // creates table of doctors at startup
  mydb.run(
    "CREATE TABLE doctor (did INTEGER PRIMARY KEY, dfname TEXT NOT NULL, dlname TEXT NOT NULL, dspec TEXT NOT NULL, demail TEXT NOT NULL)",
    (error) => {
      if (error) {
        // tests error: display error
        console.log("---> ERROR: ", error);
      } else {
        // tests error: no error, the table has been created
        console.log("---> Table created!");

        // insert the doctors
        doctor.forEach((oneDoctor) => {
          mydb.run(
            "INSERT INTO doctor (did, dfname, dlname, dspec, demail) VALUES (?, ?, ?, ?, ?)",
            [
              oneDoctor.docid,
              oneDoctor.fname,
              oneDoctor.lname,
              oneDoctor.specialization,
              oneDoctor.email,
            ],
            (error) => {
              if (error) {
                console.log("ERROR: ", error);
              } else {
                console.log("A line was added into the doctor table");
              }
            }
          );
        });
      }
    }
  );
}

function initTableTreatment(mydb) {
  const treatment = [
    {
      treatid: "1",
      description: "Routine check-up and consultation.",
      startdate: "2024-01-10",
      enddate: "2024-01-10",
      medname: "N/A",
      meddose: "N/A",
      pid: 1,
      did: 4,
    },
    {
      treatid: "2",
      description: "Management of hypertension.",
      startdate: "2024-02-15",
      enddate: "2024-08-15",
      medname: "Lisinopril",
      meddose: "10 mg daily",
      pid: 2,
      did: 1,
    },
    {
      treatid: "3",
      description: "Diabetes management and monitoring.",
      startdate: "2024-03-01",
      enddate: "2024-12-01",
      medname: "Metformin",
      meddose: "500 mg twice daily",
      pid: 3,
      did: 5,
    },
    {
      treatid: "4",
      description: "Treatment for seasonal allergies.",
      startdate: "2024-04-01",
      enddate: "2024-09-01",
      medname: "Cetirizine",
      meddose: "10 mg daily",
      pid: 4,
      did: 4,
    },
    {
      treatid: "5",
      description: "Osteoporosis management.",
      startdate: "2024-05-15",
      enddate: "2025-05-15",
      medname: "Alendronate",
      meddose: "70 mg weekly",
      pid: 5,
      did: 8,
    },
    {
      treatid: "6",
      description: "Management of chronic migraine.",
      startdate: "2024-06-10",
      enddate: "2024-12-10",
      medname: "Topiramate",
      meddose: "25 mg daily",
      pid: 6,
      did: 2,
    },
    {
      treatid: "7",
      description: "Heart disease management and monitoring.",
      startdate: "2024-07-05",
      enddate: "2025-07-05",
      medname: "Atorvastatin",
      meddose: "20 mg daily",
      pid: 7,
      did: 6,
    },
    {
      treatid: "8",
      description: "Treatment for asthma.",
      startdate: "2024-08-20",
      enddate: "2024-11-20",
      medname: "Albuterol",
      meddose: "90 mcg inhaled every 4-6 hours as needed",
      pid: 8,
      did: 7,
    },
    {
      treatid: "9",
      description: "Management of age-related macular degeneration.",
      startdate: "2024-09-15",
      enddate: "2025-09-15",
      medname: "Lucentis",
      meddose: "One injection every month",
      pid: 9,
      did: 4,
    },
    {
      treatid: "10",
      description: "Management of arthritis pain.",
      startdate: "2024-10-10",
      enddate: "2025-10-10",
      medname: "Ibuprofen",
      meddose: "400 mg every 8 hours as needed",
      pid: 10,
      did: 3,
    },
    {
      treatid: "11",
      description: "Treatment for chronic depression.",
      startdate: "2024-11-01",
      enddate: "2025-05-01",
      medname: "Sertraline",
      meddose: "50 mg daily",
      pid: 11,
      did: 2,
    },
    {
      treatid: "12",
      description: "Management of high cholesterol.",
      startdate: "2024-12-01",
      enddate: "2025-12-01",
      medname: "Simvastatin",
      meddose: "40 mg daily",
      pid: 12,
      did: 5,
    },
  ];

  // creates table of treatments at startup
  mydb.run(
    // Code for addid a foreign key adapted from a website - BEGIN
    // Source: (magichat, 2024, "How to Create a Table With a Foreign Key in SQL?", https://www.geeksforgeeks.org/how-to-create-a-table-with-a-foreign-key-in-sql/
    "CREATE TABLE treatment (tid INTEGER PRIMARY KEY, tdesc TEXT NOT NULL, tstart TEXT NOT NULL, tend TEXT, tmed TEXT, tdose TEXT, pid INTEGER, did INTEGER, FOREIGN KEY (pid) REFERENCES patient(pid), FOREIGN KEY (did) REFERENCES doctor(did))",
    // Code for addid a foreign key adapted from a website - END
    (error) => {
      if (error) {
        // tests error: display error
        console.log("---> ERROR: ", error);
      } else {
        // tests error: no error, the table has been created
        console.log("---> Table created!");

        // insert the treatments
        treatment.forEach((oneTreatment) => {
          mydb.run(
            "INSERT INTO treatment (tid, tdesc, tstart, tend, tmed, tdose, pid, did) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              oneTreatment.treatid,
              oneTreatment.description,
              oneTreatment.startdate,
              oneTreatment.enddate,
              oneTreatment.medname,
              oneTreatment.meddose,
              oneTreatment.pid,
              oneTreatment.did,
            ],
            (error) => {
              if (error) {
                console.log("ERROR: ", error);
              } else {
                console.log("A line was added into the treatment table");
              }
            }
          );
        });
      }
    }
  );
}
