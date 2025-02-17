const express = require('express');
const basicAuth = require('express-basic-auth');
const {JsonDB} = require('node-json-db');
const {Config} = require('node-json-db/dist/lib/JsonDBConfig');
const uniqid = require('uniqid');
const hash = require('object-hash');
const app = express();
const bodyParser = require('body-parser');
const pdfDocument = require('pdfkit');
const { renderTemplateFile } = require('template-file');
const customerID = process.env.CUSTOMER_ID || require('../config').CUSTOMER_ID;
const customerCode = process.env.CUSTOMER_CODE || require('../config').CUSTOMER_CODE;


const database = new JsonDB(new Config('db', true, false, '/'));

app.use(bodyParser.json());

app.use(basicAuth({
    challenge: true,
    authorizer: (user, password) => (password == customerCode && user == customerID)
})); 

app.get('/getStatus/:orderId', (req, res) => {

    console.log('[INFO] getStatus called');

    try {

        const savedOrder = database.getData(`/orders/${req.params.orderId}`);

        res.status(200).send({
            OrderID: req.params.orderId,
            Ref: savedOrder.Ref,
            Executed: savedOrder.Executed,
            Status: savedOrder.status
        });
    }
    catch(err){
        res.status(404).send({message: `Order not found!`});
    }

    res.status(400).send();

});

app.get('/getIdentDataPDF/:orderId', (req, res) => {

    console.log('[INFO] getIdentDataPDF called');

    try {

        const savedOrder = database.getData(`/orders/${req.params.orderId}`);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Access-Control-Allow-Origin': '*',
           // 'Content-Disposition': 'attachment; filename=Untitled.pdf'
        });

        const doc = new pdfDocument();

        doc.pipe(res);

        renderTemplateFile(__dirname + '/assets/template.html', 
                          {
                              address: {...savedOrder.Address},
                              user: {...savedOrder.IdentData, Email: savedOrder.Email}
                          })
            .then(renderedString => {
                doc.fontSize(25)
                   .text('Test PDF Output');
                doc.fontSize(10)
                   .text(renderedString.replace(/\r\n|\r/g, '\n'));
                doc.end();
            }

        );
        
    }
    catch(err){
        console.log(err.message);
        res.status(404).send({message: `Order not found!`});
    }

});

app.get('/getIdentData/:orderId', (req, res) => {
    console.log('[INFO] getIdentData called');

    try {

        const savedOrder = database.getData(`/orders/${req.params.orderId}`);

        res.status(200).send({
            Identitfied: new Date(Date.now()),
            IdentData: [
                {
                    ...savedOrder.IdentData,
                    DriverLicence: {
                        ...savedOrder.IdentData.DriverLicence
                    }
                }
            ]
        });
        
    }
    catch(err){
        console.log(err.message);
        res.status(404).send({message: `Order not found!`});
    }

});

app.get('*', (req, res) => {
    console.log('GET', req.url, 'not implemented');
    res.status(400).send({message: `Not implemented: ${req.url}`});

});

app.put('/putOrder', (req, res) => {

    console.log('[INFO] putOrder called');

    if(req.body.Product !== null && req.body.Add !== null ){

        const order = {...req.body, status: []};
        const orderId = uniqid();
    
        database.push(`/orders/${orderId}`, order);
        
        const responseData = {
            OrderID: orderId,
            Ref: order.Ref,
            VideoHashes: {
                ShortCode: hash(orderId),
                LongCode: hash(order)
            }
        }
        res.status(200).send(responseData);

    }
    else {
        res.status(400).send();
    }

});

app.put('*', (req, res) => {
    console.log('put', req.url, 'not implemented');
    res.status(400).send({message: `Not implemented: ${req.url}`});

});

app.post('/addStatus/:orderId', (req, res) => {

    console.log('[INFO] addStatus called');

    if(req.body !== {} && req.body.Kind && req.body.Time){
        try {

            const savedOrder = database.getData(`/orders/${req.params.orderId}`);

            if(savedOrder){

                const doesStatusExist = savedOrder.status.find(s => s.Kind && s.Kind === req.body.Kind);
                if(doesStatusExist) {
                    res.status(400).send({message: "Status is already set!"})
                }
                else {

                    const editedOrder = {
                        ...savedOrder,
                        Executed: new Date(Date.now()),
                        status: [
                            ...savedOrder.status,
                            {...req.body}
                        ]
                    }
            
                    database.push(`/orders/${req.params.orderId}`, editedOrder, true);
            
                    res.status(200).send();

                }
            }

            else res.status(400).send();

        }
        catch(err){

            res.status(400).send();

        }

    }

    else res.status(400).send();

});

app.post('/addDriverLicense/:orderId', (req, res) => {

    console.log('[INFO] addDriverLicense called');

    if(req.body !== {} && req.body.LicenceNo && req.body.Classes){
        try {

            const savedOrder = database.getData(`/orders/${req.params.orderId}`);

            if(savedOrder){

                const doesDriverLicenseExist = savedOrder.IdentData.DriverLicense == req.body.Classes;
                if(doesDriverLicenseExist) {
                    res.status(400).send({message: "License is already set!"})
                }
                else {

                    const editedOrder = {
                        ...savedOrder,
                        IdentData: {
                            ...savedOrder.IdentData,
                            DriverLicence: {
                                Classes: req.body.Classes,
                                LicenceNo: req.body.LicenceNo,
                                DateOfIssue: req.body.DateOfIssue || new Date(Date.now() - 100000),
                            }
                        }
                    }
            
                    database.push(`/orders/${req.params.orderId}`, editedOrder, true);
            
                    res.status(200).send();

                }
            }

            res.status(400).send();

        }
        catch(err){

            res.status(400).send();

        }

    }

    res.status(400).send();

});

app.post('*', (req, res) => {
    console.log('POST', req.url, 'not implemented', req.body);
    res.status(400).send({message: `Not implemented: ${req.url}`});

});

app.delete('/delIdentdata/:orderId', (req, res) => {
    console.log('[INFO] delIdentdata called');

    try {

        const savedOrder = database.getData(`/orders/${req.params.orderId}`);
        //database.delete(`/orders/${req.params.orderId}`);
        res.status(202).send();

    }
    catch(err){

        res.status(404).send();

    }
    res.status(400).send();

});

app.delete('*', (req, res) => {
    console.log('DELETE', req.url, 'not implemented');
    res.status(400).send({message: `Not implemented: ${req.url}`});

});

module.exports = app;