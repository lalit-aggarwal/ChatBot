var express = require('express');
var watson = require('watson-developer-cloud');
var xmlParser = require('xml2js');
var fs = require('fs');
var events = require('events');
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');
var eventEmitter = new events.EventEmitter();
var app = express();
app.use(express.static('public'));
app.use(bodyParser());

var session = new Object();
var context, docContext;

var transporter = nodemailer.createTransport(
    {
    service: 'gmail',
    auth: {
        user: 'nagarro.jpr@gmail.com',
        pass: 'Mayank@#99'
    }
});

var sendMail = function (to, subject, body) 
{
    var mailOptions = 
    {
        from: 'lalit.aggarwal@nagarro.com',
        to: to,
        subject: subject,
        html: body
    };

    transporter.sendMail(mailOptions, function (error, info) 
    {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

var testData = require('./labTestDetails.json');

var labTestDocument = function (response) 
{
    var body = 'Hi Sir/Madam, <br><br>Appointment for ' + response.context.testName + ' is booked.<br>';
    body = body + 'Your appointment schedule: ' + response.context.date + ', ' + response.context.time + '<br><br>';
    body = body + 'Thanks,<br>Lalit Aggarwal<br>Senior Consultant, My Labs';
    return body;
}

var doctorBookingDocument = function (response)
 {
    var body = 'Hello Sir/Madam, <br><br>Appointment with ' + response.context.doctorName + ' is booked.<br>';
    body = body + 'Your appointment schedule: ' + response.context.date + ', ' + response.context.time + '<br><br>';
    body = body + 'Thanks,<br>Lalit Aggarwal<br>Senior Consultant, My Labs';
    return body;
}
var getTestLabDetails = function (newResponse, response) 
{
    var description, price;
    var myResponse = newResponse[0];
    if (testData.avilableTests.length != 0) 
    {
        for (var i = 0; i < testData.avilableTests.length; i++) 
        {
            if (testData.avilableTests[i].name == response.context.testName) 
            {
                description = testData.avilableTests[i].description;
                price = testData.avilableTests[i].price;
                myResponse = myResponse + "<br><br>Procedure: <br>" + description + "<br><br>Test Cost: " + price + "<br><br>";
                break;
            }
        }
        myResponse = myResponse + "Do you want to schedule an appointment for " + response.context.testName + "?";
    }
    newResponse[0] = myResponse;
}
var disease = require('./doctorDetails.json');

var GetDoctors = function (symptom) 
{
    var doctors;
    for (var i = 0; i < disease.symptoms.length; i++) 
    {
        if (disease.symptoms[i].name == symptom) {
            doctors = disease.symptoms[i].doctors;
            break;
        }
    }
    return doctors;
}

class DoctorData 
{
    constructor(response, responseAction, username)
     {
        this.response = response;
        this.responseAction = responseAction;
        this.username = username
    }
}

class LabData 
{
    constructor(response, username)
    {
        this.response = response;
        this.username = username;
    }
}


var sendLabBookingMail = function (response) {
    sendMail(session.email, "Lab Test Booked | My Labs", labTestDocument(response));
}

var sendDoctorBookingMail = function (response) {
    sendMail(session.email, "Doctor Appointmnet Scheduled | My Labs.", doctorBookingDocument(response));
}


var conversation;
var labTestId;
var doctorappointmentId;

var myWatsonData = function ()
 {
    var parser = new xmlParser.Parser();
    fs.readFile('watson.xml', function (err, data)
     {
     if (err) 
        {
            console.log('Error');
        } 
        else 
        {
            parser.parseString(data, function (err, result) 
            {
                if (err)
                 {
                    console.log('Error');
                }
                 else 
                 {
                    conversation = watson.conversation({ 
                        username: result.data.username,
                         password: result.data.password, 
                         version: 'v1',version_date: '2017-12-30'
                    });
                    labTestId = result.data.labtest;
                    doctorappointmentId = result.data.doctorBooking;
                }
            });
        }
    });
}



var myTestData = function (req, newResponse) 
{
    // delete context.date;
    // delete context.time;
    var myResponse = newResponse[0];
    if (testData.avilableTests.length != 0) 
    {
        myResponse = myResponse + "<br><ol>";
        for (var i = 0; i < testData.avilableTests.length; i++) 
        {
            myResponse = myResponse + "<li>" + testData.avilableTests[i].name + '</li>';
        }
        myResponse = myResponse + "</ol>";
    }
    newResponse[0] = myResponse;
}

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/form.html");
});

app.post("/bookingOption", function (req, res) {
    session.firstname = req.body.first_name;
    session.lastname = req.body.last_name;
    session.email = req.body.email;
    res.sendFile(__dirname + "/bookingOption.html");
});

app.get("/labTest", function (req, res) 
{
    if (session.email != undefined && session.email != null) 
    {
        res.sendFile(__dirname + "/lab.html");
    } 
    else 
    {
        res.redirect('/');
    }
});

app.get("/doctor", function (req, res) 
{
    if (session.email != undefined && session.email != null ) 
    {
        res.sendFile(__dirname + "/doctor.html");
    } else {
        res.redirect('/');
    }
});

app.get("/conversationDoctor", function (req, res) 
{
    conversation.message(
        {
        workspace_id: doctorappointmentId,
        input: { 'text': req.query.userResponse },
        context: context
    }, function (err, response) {
        var newResponse, responseAction;
        if (err) {
            newResponse = new Array(1);
            newResponse[0] = "Error";
            console.log(err);
        } else {
            responseAction = "Display";
            context = response.context;
            newResponse = response.output.text
            if (response.output.action == 'getsymptom') {
                responseAction = "map";
                var symptom = response.context.abc;
                newResponse.push(GetDoctors(symptom));
                console.log(newResponse);
            }
            else if (response.output.action == 'sendMail') {
            console.log("mail sending");
            sendDoctorBookingMail(response);
            }
        }
        res.send(new DoctorData(newResponse, responseAction, session.firstname));
    });
});

app.get("/conversationLabTest", function (req, res) {

    conversation.message({
        workspace_id: labTestId,
        input: { 'text': req.query.userResponse },
        context: docContext
    }, function (err, response) {
        var newResponse;
        if (err) {
            newResponse = new Array(1);
            newResponse[0] = "Sorry there is problem in service";
            console.log(err);
        } else {
            docContext = response.context;
            newResponse = response.output.text;
            if (response.output.action == 'addLabTestList') {
                myTestData(req, newResponse);
            } else if (response.output.action == 'testDetail') {
                getTestLabDetails(newResponse, response);
            } else if (response.output.action == 'sendMail') {
                console.log("mail sending");
                sendLabBookingMail(response);
            }
        }
        res.send(new LabData(newResponse, session.firstname));
    });
});

eventEmitter.on('connected', myWatsonData);

var server = app.listen(8081, function ()
 {
    var host = server.address().address;
    var port = server.address().port;
    eventEmitter.emit('connected');
});



