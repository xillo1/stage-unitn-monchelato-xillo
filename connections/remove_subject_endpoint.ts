//This is the remove_subject endpoint, it's used by the Event Receiver to remove a subject from the Event Stream.

import { Request, Response } from 'express';
import { remove_subject } from '../models/subjects';
import { ExtractSubjectID} from '../functions/extractJSON';
import { sub_verification } from '../functions/subject_verification';


export function remove_subject_end(req: Request, res: Response) {
    if(sub_verification(req,res)){   
        const subject = ExtractSubjectID(req);
        if(subject){
            const result = remove_subject(subject.value);
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