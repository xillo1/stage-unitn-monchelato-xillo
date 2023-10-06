//This is the add_subject endpoint, it's used by the Event Receiver to add a subject to the Event Stream.

import { Request, Response } from 'express';
import { findSubjectDB, findSubjectDB_2 } from '../MongoDB/db_query';
import { ExtractSubjectID } from '../functions/extractJSON';
import { sub_verification } from '../functions/subject_verification';

let verified: boolean;

export function add_subject_end(req: Request, res: Response) {

    //Controls the body of the request
    if(sub_verification(req,res)){
        const subject = ExtractSubjectID(req);
        if(subject){
            if("iss" in subject )
            {
                findSubjectDB_2(subject.format,subject.iss,subject.value).then((found) => {
                    if (!found) {
                        res.status(403).json({error: "Failed to add subject"})                 
                    }
                })
                .catch((error) => {
                    console.error("Error in Db query:  /add_subject_endpoint", error);
                    res.status(403).json({error: "Error in Db query"})
                });            
            }
            else{
                findSubjectDB(subject.format,subject.value).then((found) => {
                    if (!found) {
                        res.status(403).json({error: "Failed to add subject"})                 
                    }
                })
                .catch((error) => {
                    console.error("Error in Db query:  /add_subject_endpoint", error);
                    res.status(403).json({error: "Error in Db query"})
                });
                        
                }
            }
            else{
                res.status(600).json({ error : 'Format or identifier not valid'});
            }
        }

        //Check if optional parameter "verified" is present
        if (req.body.hasOwnProperty('verified') && req.body.verified !== undefined) {
            verified = req.body.verified;
        }
        res.status(200).send();
}  