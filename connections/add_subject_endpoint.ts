//This is the add_subject endpoint, it's used by the Event Receiver to add a subject to the Event Stream.

import { Request, Response } from 'express';
import { findSubjectDB, findSubjectDB_2 } from '../MongoDB/db_query';
import { sub_verification } from '../models/subject_verification';
import { add_subject, ExtractSubjectID } from '../models/subjects';

let verified: boolean;

export async function add_subject_end(req: Request, res: Response) {

    //Controls the body of the request, return true if required fields are present
    if(sub_verification(req,res)){

        //This funcion will return either a JSON object composed of "format": "xxx", "value": "xxx", "iss": "xxx" where value is the id associated to a subject with that format, and
        //iss is an optional field that will be present only in some specific formats of the subject, it returns undefined if the format field is not set-up correctly
        const subject = ExtractSubjectID(req.body.subject);
        if(subject){
            //Here we check if 'iss' exist, meaning we have to use a different user model to check if the subject is present on the DB
            if("iss" in subject )
            {
                //This funcion returns true if we found the subject from the database using the UserModel2 and managed to add it to the internal structure
                await findSubjectDB_2(subject.format,subject.iss,subject.value).then((found) => {
                    if (!found) {
                        res.status(403).json({error: "Failed to add subject, not found in database"})                
                    }
                    else
                    {
                        add_subject(req.body.sub, subject.value, "enabled");
                        if(req.body.subject.format !== "email")
                        {
                            res.status(200).json({Warning: "Monokee will recognize only subjects with format 'email' "});
                            return;
                        }
                        else
                            res.status(200).send();
                    }
                })            
            }
            else{
                //This funcion returns true if we found the subject from the database using the UserModel1 and managed to add it to the internal structure
                findSubjectDB(subject.format,subject.value).then((found) => {
                    if (!found) {
                        res.status(403).json({error: "Failed to add subject, not found in database"})               
                    }
                    else
                    {
                        add_subject(req.body.sub, subject.value, "enabled");
                        if(req.body.subject.format !== "email")
                        {
                            res.status(200).json({Warning: "Monokee will recognize only subjects with format 'email' "});
                            return;
                        }
                        else
                            res.status(200).send();
                    }
                })        
            }
        }
        else{
            res.status(600).json({ error : 'Format or identifier not valid'});
            return;
        }
        //Check if optional parameter "verified" is present (For now this variable is usless)
        if (req.body.hasOwnProperty('verified') && req.body.verified !== undefined) {
            verified = req.body.verified;
        }
    }
}  