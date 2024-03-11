//This endpoint rturns a public key, however it is not implemented a signature with private key

import { Request, Response } from 'express'
import * as jose from 'node-jose'

export function getJWK(req:Request, res: Response)
{
  const fs = require('fs');

  // Read public key from file
  const publicKey = fs.readFileSync('publicKey.pem', 'utf8');

  jose.JWK.asKey(publicKey, 'pem').then(function(jwk) {
    const jwkJSON = jwk.toJSON(true);
    res.status(200).json(jwkJSON);
    
  }).catch(function(error) {
    res.status(403).json({
      error: "Error converting key in JWK",
      key: publicKey});

    console.error('Error in conversion to JWK:', error);
  });
  
}