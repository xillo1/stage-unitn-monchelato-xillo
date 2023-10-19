//This is the remove_subject endpoint, it's used by the Event Receiver to remove a subject from the Event Stream.

import { Request, Response } from 'express';
import { remove_subject, ExtractSubjectID } from '../models/subjects';
import { sub_verification } from '../models/subject_verification';


export function remove_subject_end(req: Request, res: Response) {
    //This funcion returns true if the required parameters are present and not empty, false otherwise
    if(sub_verification(req,res)){   
        //This funcion will return either a JSON object composed of "format": "xxx", "value": "xxx", "iss": "xxx" where value is the id associated to a subject with that format, and
        //iss is an optional field that will be present only in some specific formats of the subject, it returns undefined if the format field is not set-up correctly
        const subject = ExtractSubjectID(req.body.subject);
        if(subject){
            //This funcion returns the userID if we found it and managed to remove it from the internal structure, undefined otherwise
            const result = remove_subject(req.body.sub, subject.value);
            if(result !== undefined){
                res.status(204).send();
            }
            else{
                res.status(404).json({error : "Subject not recognized"});
            }
        }
        else {
            res.status(600).json({error : "Request not valid"});
        }
    }
}