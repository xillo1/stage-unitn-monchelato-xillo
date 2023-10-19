import { Request, Response } from 'express';
import { get_subject, update_status, ExtractSubjectID } from '../models/subjects';
import {get_config, update_status_config} from '../models/sharedConfig';
import * as url from 'url';
import * as querystring from 'querystring';


//Funcion to get the stream status or a specific subject status (GET)
export function getStatus(req: Request, res: Response) {

    //This funcion returns a JSON object containing the subject information if the client sent them in the url, undefined otherwise
    const subject_claim = exstract_subject_get(req);
    if (subject_claim !== undefined) {

        //This funcion will return either a JSON object composed of "format": "xxx", "value": "xxx", "iss": "xxx" where value is the id associated to a subject with that format, and
        //iss is an optional field that will be present only in some specific formats of the subject, it returns undefined if the format field is not set-up correctly
        let subject = ExtractSubjectID(subject_claim);
        
        if(subject){
            //Funcion that returns the subject if we found it inside our internal structure, undefined otherwise
            const found = get_subject(req.body.sub, subject.value);
            if(found !== undefined){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json({ 
                    subject_claim, 
                    "status" : found.status,
                 });
            }
            else{
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ error: "Not found in the stream" }); 
            }
        }
        else{
            res.setHeader('Content-Type', 'application/json');
            res.status(404).json({error: "Subject type not valid"});
        }
    }

    //If there is no subject, we send the status of the stream
    else{
        let config = get_config(req.body.sub);
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({"stream status": config?.status});
    }   
}


//This funcion is to update the status of the stream/subject, it can be called by the receiver as well as the transmitter
export function updateStatus(req: Request, res: Response) {
    if(!req.body.hasOwnProperty("status"))
    {
        res.status(400).json({error: 'status not found in the request'});
        return;
    }
    try{
        const newState = req.body.status;
        if(newState !== "enabled" && newState !== "disabled" && newState !== "paused")
        {
            res.status(202).json({error: "New status not valid"});
        }
        //If the request to update the status has a subject claim in the body we update the status for that subject
        if (req.body.hasOwnProperty('subject') && req.body.subject !== undefined) {
            const subject = ExtractSubjectID(req.body.subject);
            if(subject){
                const found = get_subject(req.body.sub, subject.value);                
                if(found !== undefined){
                    const result = update_status(req.body.sub, subject.value, newState);
                    if(result)
                    {
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).json({
                            state: newState 
                        });
                    }
                }
                else{
                    res.setHeader('Content-Type', 'application/json');
                    res.status(404).json({error: "Subject not found in the stream"});
                }
            }
            else{
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({error: "Subject type not valid"});
            }
        }
        //Else we update the status of the stream
        else{
            update_status_config(req.body.sub, newState);
            res.status(200).json({ "Stream status updated": newState });
        }
    } 
    catch(error)
    {
        res.status(202).json({error: "Internal error, request not processed, may try later"});
    }   
}





function exstract_subject_get(req: Request)
{
    //Get the url
    const urlString = req.originalUrl;
    //We devide the string if we found a ?, if there is a subject it will be directly after 
    const params = querystring.parse(urlString.slice(urlString.indexOf('?') + 1));
    //Check if 'subject' is present
    if (params['subject']) {
        //Parse URL
        const parsedUrl = url.parse(urlString, true);
    
        //Exstract parameter from URL
        const queryParams = parsedUrl.query;
        //Exstract and decode 'subject'
        const subjectParam = queryParams['subject'] as string;
        const decodedSubject = decodeURIComponent(subjectParam);
        const cleanedSubject = decodedSubject.replace(/<|>/g, '');
        const subjectObject = JSON.parse(cleanedSubject);

        //Return the JSON object containing our subject
        return subjectObject;

    } else {
        return undefined;
    }   
}

