'use server'

import xlsx from 'node-xlsx'
import { createFirebaseAuthUser } from '../google/firebaseAdmin'
import { getUserByEmail } from '../google/firebaseAdmin'

import { doc, collection, setDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
// Firestore
import { db } from '@/utils/firebase/firebaseinit'

export const addUsersbyxlsx = async (formData) => {
  const excelFile = formData.get('excelFile');
  let xlsxArray = new Uint8Array(await excelFile.arrayBuffer());

  // Load xlsx
  const workbook = xlsx.parse(xlsxArray);
  const sheet_array = workbook[0]["data"];

  // Skip the first row (usually the header)
  const dataRows = sheet_array.slice(1);

  // Filter out rows where elem[0] is undefined
  const validDataRows = dataRows.filter((elem) => elem[0] !== undefined);

  // Map users with their departments
  const usersMap = new Map();
  validDataRows.forEach((elem) => {
    const [name, email, officeLocation, eachDepartment, jobLevel, password] = elem;
    if (!usersMap.has(email)) {
      usersMap.set(email, {
        name,
        email,
        officeLocation,
        department: new Set([eachDepartment]),
        jobLevel: jobLevel || "",
        password
      });
    } else {
      usersMap.get(email).department.add(eachDepartment);
    }
  });

  const users = Array.from(usersMap.values()).map((user) => ({
    ...user,
    departments: Array.from(user.department) // Convert Set to Array
  }));

  const processedEmails = new Set();
  let registeredCount = 0;
  let failedCount = 0;
  const errors = [];

  try {
    const creationResults = await Promise.all(
      users.map(async (user) => {
        const { name, email, password, officeLocation, department, jobLevel } = user;

        if (processedEmails.has(email)) {
          console.log(`User with email ${email} already processed.`);
          return { email, status: 'already processed' };
        }

        let userRecord;
        try {
          userRecord = await getUserByEmail(email);
        } catch (error) {
          console.error(`Error checking user with email ${email}:`, error);
        }

        if (!userRecord) {
          try {
            const resultUid = await createFirebaseAuthUser({
              displayName: name,
              email,
              password,
            });
            processedEmails.add(email);
            registeredCount++;

            const docRef = doc(db, "users", resultUid);
            await setDoc(docRef, {
              uid: resultUid,
              email: email,
              name: name,
              password: password,
              department: Array.from(department),
              officeLocation: officeLocation,
              jobLevel: jobLevel,
              isAdmin: jobLevel == "管理者" || jobLevel == "責任者" ? true : false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            return { uid: resultUid, email, status: 'created' };
          } catch (error) {
            failedCount++;
            console.error ("### debug ###", error)
            errors.push({ email, error: error.message });
            console.error(" #### for FBAuth Error debug #### ")
            return { email, status: 'error', error: error.message };
          }
        } else {
          processedEmails.add(email);
          try {
            const userRef = doc(db, "users", userRecord.uid);
            await updateDoc(userRef, {
              department: arrayUnion(...department),
            });

            return { email, status: 'exists' };
          } catch (error) {
            failedCount++;
            errors.push({ email, error: error.message });
            return { email, status: 'error', error: error.message };
          }
        }
      })
    );

    const resultSummary = {
      registeredCount,
      failedCount,
      errors,
      creationResults: creationResults.map(result => ({
        email: result.email,
        status: result.status,
        uid: result.uid || null,
        error: result.error || null
      }))
    };

    console.log("Firebase user creation results:", resultSummary);
    return resultSummary;
  } catch (error) {
    console.error("Error creating Firebase users:", error);
    console.error(" #### for debug #### ")
    return { status: 'error', error: error.message };
  }
};
