import { get_internal_status } from '../connections/status_endpoint';
import { NextFunction } from 'express-serve-static-core';
import { Request, Response } from 'express';

export function restrictAccess(req: Request, res: Response, next: NextFunction) {
    const internalStatus = get_internal_status(); // Ottieni lo stato interno
  
    //If state != 'e' we let reach only configuration_endpoint
    if (internalStatus !== 'enabled' && req.path === '/configuration_endpoint') {
      // Permetti solo l'accesso al metodo GET se lo stato è diverso da 'e'
        if (req.method === 'POST') {
          return next();
        }
    }
  
    //If state = 'e' let reach all endpoints
    if (internalStatus === 'enabled') {
      return next();
    }
    
    //Else send 403 Forbidden
    res.status(404).json({ error: 'Access denied, stream not configured' });
  }