//This is the verification endpoint,it allows the receiver to confirm that the stream is configured correctly upon successful receipt of the event

import { Request, Response } from 'express';

let state = "verificationCodeHere";

function sendVerificationEvent(req: Request, res: Response) {
    const verificationEvent = {
        //Optional claim
        //"jti": "12345" 
        //"iat": "0934723987"  
        "iss": "http://localhost/" ,
        "aud":  req.body.iss,
        "events": {
            "http://localhost/verification":{       //Da modificare
                "state": state
            }
        }
      };

      res.json(verificationEvent);
}

export function verification(req: Request, res: Response) {
    //Check if optional parameter "state" is present
    if (req.body.hasOwnProperty('state') && req.body.state !== undefined) {
        state = req.body.state;
    }
    res.status(204).send();
    sendVerificationEvent(req, res);
}


