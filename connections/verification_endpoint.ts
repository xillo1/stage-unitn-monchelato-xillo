//This is the verification endpoint,it allows the receiver to confirm that the stream is configured correctly upon successful receipt of the event

import { Request, Response } from 'express';
import { verification_sender } from '../events/events_detector';


let state = "verificationCodeHere";


export function verification(req: Request, res: Response) {
    //Check if optional parameter "state" is present
    if (req.body.hasOwnProperty('state') && req.body.state !== undefined) {
        state = req.body.state;
    }
    res.sendStatus(204);
    return verification_sender(req, state);
}