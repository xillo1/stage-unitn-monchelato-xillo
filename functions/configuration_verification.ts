import { Request, Response } from 'express';

export function conf_verification_post( req:Request, res:Response ): boolean
{
    //Try access body of request
    const reqbody = req.body;
    if (!reqbody) {
      //If the body cannot be analyzed
      res.status(400).json({ error: 'Request not valid' });
      return false;
    } 

    if(req.body.hasOwnProperty('iss') && req.body.iss !== undefined){
        
        if(req.body.hasOwnProperty('aud') && req.body.aud !== undefined){

            if(req.body.hasOwnProperty('delivery') && req.body.delivery !== undefined ){
                
                if(req.body.hasOwnProperty('events_requested')){ return true;}

                res.status(400).json({error: 'events_requested field not found'});
                return false;
            }
            res.status(400).json({error: 'delivery field not found or empty'});
            return false;
        }
        res.status(400).json({error: 'aud field not found or epmty'});
        return false;
    }
    res.status(400).json({error: 'iss field not found or empty'});
    return false;
} 