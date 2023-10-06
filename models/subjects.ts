interface Utente {
    id: string;
    status : string;
}

interface AddedSubjects {
    [userId: string]: Utente;
}

const added_subjects: AddedSubjects = {};

export function add_subject(userId: string, status: string) {
    const utente: Utente = {
        id: userId,
        status: status
    };
    added_subjects[userId] = utente;
    console.log(`Subject ${userId} added with status: ${status}`);
}

export function get_subject(userId: string): Utente | undefined {
    const subjectToUpdate = added_subjects[userId];
    if (subjectToUpdate) {
        return added_subjects[userId];
    }
    else
    {
        console.log(`Subject ${userId} not found. Status not updated.`);
        return undefined;
    }
}

export function remove_subject(userId: string): string | undefined {
    const subject_to_remove = added_subjects[userId];
    
    //If we found the subject we remove it
    if (subject_to_remove) {
        delete added_subjects[userId];
        console.log(`Subject ${userId} removed`);
        return userId;
    } else {
        //Subject not present
        console.log(`Subject ${userId} not removed`);
        return undefined;
    }
}

export function update_status(userId: string, newStatus: string): boolean {
    const subjectToUpdate = added_subjects[userId];
    //If we found the subject we update the status
    if (subjectToUpdate) {
      subjectToUpdate.status = newStatus;
      console.log(`Status for subject ${userId} updated to: ${newStatus}`);
      return true;
    } else {
      //We didn't find the subject
      console.log(`Subject ${userId} not found. Status not updated.`);
      return false;
    }
  }
  






