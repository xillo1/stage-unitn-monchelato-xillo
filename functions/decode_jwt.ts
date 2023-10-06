import * as jose from 'jose'
import { Request, Response } from 'express';
import { NextFunction } from 'express-serve-static-core';
import { sharedState } from '../models/sharedState';

//Funcion to decode the JWT
export function decode_JWT(req: Request, res: Response, next: NextFunction) {

    let jwt;
    //Check if JWT exist
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        //remove "Bearer " to get the JWT
        jwt = authorizationHeader.substring(7); 
    }   

    //If we found the JWT we decode it
    if(jwt)
    {
        const protectedHeader = jose.decodeProtectedHeader(jwt)
        //console.log(protectedHeader)

        const claims = jose.decodeJwt(jwt)
        //console.log(claims)

        sharedState.jwtPayload = claims;
    }

    //Else we give error
    else{
        sharedState.jwtPayload = null;
        return res.status(401).json({ error: 'Token JWT non presente.' });
    }
    //Go to next funcion
    next();
}



