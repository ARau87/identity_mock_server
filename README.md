# Identity Mock Server

To reduce the effort (and be more independent) while testing connections to Identity TM API (Version 2.0) this server can be used instead of the real API.
This server simulates the most common endpoints of the real API but also provides endpoints to manipulate the identity orders. It is also possible to change
the orders directly as this server uses a json file to save incoming data.

## Requirements

To run the server Node.js 12.3.1 or greater is required. Please download the installer from [here](https://nodejs.org/en/). The server should run on Windows 10 (tested) as well as on Unix systems.

## Installation

1. Clone the project

`git clone https://github.com/ARau87/identity_mock_server`

2. Open a Terminal and install the project

```bash
$ cd identity_mock_server
$ npm install
```

3. After the project is installed a `config.js` file has to be created in the root directory of the project. The config file should have the following content:

```javascript
module.exports = {
    CUSTOMER_ID: <YOUR_IDENTITY_ID>,
    CUSTOMER_CODE: <YOUR_IDENTITY_CODE>
}
```

Note: The credentials are only needed for simulating the authentication in the Identity TM API. That means you can also provide some random credentials (as long as you use the 
same in your requests).

4. Start the server with `npm start`

## Endpoints

### Identity Endpoints:

This is only an overview over the endpoints of the mock server for more detailed information refer to Identity TM API Reference.

- `/putOrder`: Method: `PUT`, Requires: `Add` and `Product` fields in the request body
- `/getStatus/:orderId`: Method: `GET`, Requires: `orderId` as url parameter
- `/getIdentDataPDF/:orderId`: Method: `GET`,  Requires: `orderId` as url parameter
- `/getIdentData/:orderId`: Method: `GET`, Requires: `orderId` as url parameter
- `/delIdentdata/:orderId`: Method: `DELETE`, Requires: `orderId` url parameter

### Additional Endpoints (for manipulating saved orders):

- `/addStatus/:orderId`: Method `POST`, Requires: `orderId` as url parameter and `Kind` and `Time` as fields in the request body. `Kind` is a Identity Status (check the API
Reference there is section about Identity status codes.) E.g. 75 means video chat started and 6 means video chat ended with a successful result.
- `/addDriverLicense/:orderId`: Method `POST`, Requires: `orderId` as url parameter and `Classes` and `LicenceNo` as fields in the request body. `Classes` is a string with one 
or more commaseparated license classes like `B,BE,C` and `LicenceNo` a string containing the license number like `23456543D54`
