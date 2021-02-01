const support = require('../support.js'); // bring in support functions
const logon = require('../API/p_logon_handler') // bring in logon handler functions
const session = require('../Database/p_session') // import session management handlers

async function parse_http_JsonBody(req) {
    return new Promise((resolve, reject) => {
        try {
            // create body object 
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const json_body = JSON.parse(body);
                resolve(json_body);
            });
        } catch {
            support.log("error", "route_api_ingest_support.js - parse_http_JsonBody : Can NOT parse HTTP JSON BODY, unknown error");

            const r_msg = {
                "status": 0,
                "Message": "Can NOT parse HTTP JSON BODY, unknown error",
            };
            reject(r_msg);
        }


    });

};

async function evaluate_API_request(json_api_request, res) {
    support.log("debug", `route_api_ingest_support.js - evaluate_API_request : Evaluating the API request for routing to proper functions : \n ${JSON.stringify(json_api_request)}`)
    return new Promise((resolve, reject) => {
        switch (json_api_request.operation_name) {
            case 'LOGON':
                support.log("debug", `route_api_ingest_support.js - evaluate_API_request : LOGON REQUEST, Routing to Logon Handler`)
                
                // Send info to logon stuff
                logon.validate_user(json_api_request).then((r_msg) => { // password matched

                    // try and generate new session token and deliver it
                    session.create_session({"id": `${r_msg.user_id}`}).then((r_msg)=>{

                        res.status(200);
                        const response = `HTTP 200 - OK : API REQUEST RECEIVED -  ${support.getBasicDate()} \n ${JSON.stringify(r_msg)}`;
                        res.send(response);

                    }).catch((error)=>{
                       support.log("Error", `route_api_ingest_support.js - Could not generate Session Token : Unknown Error : \n ${error}`)
                        res.status(500);
                        const response = `HTTP 500 - CREDENTIALS VALIDATED - COULD NOT GENERATED SESSION TOKEN: API REQUEST RECEIVED - ${support.getBasicDate()} \n ${JSON.stringify(json_api_request)}`;
                        res.send(response);

                    })

                    

                }).catch((error) => {   // password did not match or error occurred
                    res.status(403);
                    const response = `HTTP 403 - CREDENTIALS NOT VALIDATED: API REQUEST RECEIVED - ${support.getBasicDate()} \n ${JSON.stringify(json_api_request)}`;
                    res.send(response);

                });


                break;

            default:
                support.log("Error", `route_api_ingest_support.js - evaluate_API_request : Unknown Request Type`)
                const r_msg = {
                    "status": 0,
                    "Message": "Unknown Request Type",
                };
                //reject(r_msg);

        }

        resolve();

    });
};

//export required module components
module.exports.parse_http_JsonBody = parse_http_JsonBody;
module.exports.evaluate_API_request = evaluate_API_request;
