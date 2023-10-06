import * as url from 'url';
import * as querystring from 'querystring';
import { Request } from 'express';

export function exstract_subject_get(req: Request)
{
    const urlString = req.originalUrl;
    const params = querystring.parse(urlString.slice(urlString.indexOf('?') + 1));
    // Check if 'subject' is present
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

        return subjectObject;

    } else {
        return undefined;
    }   
}
