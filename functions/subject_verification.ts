import { Request, Response } from 'express';

export function sub_verification(req: Request, res: Response): boolean {
    //Try access body of request
    const reqbody = req.body;
    if (!reqbody) {
        //If the body cannot be analyzed
        res.status(400).json({ error: 'Request not valid' });
        return false;
    }

    if(req.body.hasOwnProperty('subject') && req.body.subject !== undefined){
        if(req.body.subject.hasOwnProperty('format') && req.body.subject.format !== undefined){
            return true;}
        res.status(400).json({error: "Format field not found or empty"});
        return false;
    }
    res.status(400).json({error: "Subject field not found or empty"});
    return false; 
}