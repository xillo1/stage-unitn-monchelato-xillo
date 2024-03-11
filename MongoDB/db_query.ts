import UserModel from '../models/userModel';
import UserModel2 from '../models/userModel2';


export async function findSubjectDB(format: string, id: string) {
  try {
    //Find subject in the DB using the usermodel
    const subject = await UserModel.findOne({ format: format, id: id });
        
    //Subject found
    if (subject) {
      return true;
    } 

    //Subject not found
    else {
      console.log('Subject not found in the database:', id);
      return false;
    }
  } 
  catch (error) {
    //Manage errors
    console.error('Error in adding the subject to internal structure:', error);
    return false; 
  }
}


export async function findSubjectDB_2(format: string, iss: string, id: string) {
    try {
      //Find subject in the DB using the usermodel2
      const subject = await UserModel2.findOne({ format: format, iss: iss, id: id });
        
      //Subject found
      if (subject) {
        return true;
      } 
      //Subject not found
      else {
        console.log('Subject not found in the database:', id);
        return false;
      }
    } catch (error) {
      // Gestisci gli errori
      console.error('Error in adding the subject to internal structure:', error);
      return false; 
    }
}