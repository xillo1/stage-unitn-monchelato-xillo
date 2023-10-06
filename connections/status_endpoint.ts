import { Request, Response } from 'express';
import { get_subject, update_status } from '../models/subjects';
import { ExtractSubjectID } from '../functions/extractJSON';
import { sharedState } from '../models/sharedState';
import { exstract_subject_get } from '../functions/exstract_subject_get';


//e= enabled, d= disabled, p= paused    
type Stato = "enabled"|"disabled"|"paused";
let status : Stato  = "disabled";


//Funcion to get the stream status or a specific subject status (GET)
export function getStatus(req: Request, res: Response) {

    const subject_claim = exstract_subject_get(req);
    
    //Check if optional parameter "subject" is present
    if (subject_claim !== undefined) {
        
        let subject = ExtractSubjectID(req);
        
        if(subject){

            const found = get_subject(subject.value);
            if(found !== undefined){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json({ 
                    subject, 
                    "status" : found.status,
                 });
            }
            else{
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ error: "Not found in the stream" }); 
            }
        }
    }

    //There is no subject, we send the status of the stream
    else{
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({"stream status": status});
    }   
}

export function get_internal_status(): Stato
{
    return status;
}   

export function setStatus(nuovoStato: Stato): void {
    status = nuovoStato;
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

        if (req.body.hasOwnProperty('subject') && req.body.subject !== undefined) {
            const subject = ExtractSubjectID(req);
            if(subject){
                const found = get_subject(subject.value);                
                if(found !== undefined){
                    const result = update_status(subject.value, newState);
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
        }
        else{
            setStatus(newState);
            res.status(200).json({ "Stream status updated": newState });
        }
    } 
    catch(error)
    {
        res.status(202).json({error: "Internal error, request not processed, may try later"});
    }   
}

