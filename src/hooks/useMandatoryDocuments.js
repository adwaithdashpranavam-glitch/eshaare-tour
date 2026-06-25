import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  getMissingMandatoryDocuments,
} from "../utils/mandatoryDocuments";

// Reactive mandatory-document status for the logged-in client. Subscribes to the
// same `documents` query used by the Documents page (by traveller email) and
// derives the still-missing mandatory documents.
//
// Returns:
//   loading  - true until the first snapshot resolves
//   docs     - raw uploaded document records
//   missing  - array of missing mandatory category definitions ({ key, label })
//   isComplete - true when no mandatory document is missing
//
// Used by the wizard route guard (direct-URL protection) and available for any
// component that needs a live view of the gate.
export const useMandatoryDocuments = () => {
  const { userProfile } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = userProfile?.email;
    if (!email) {
      setDocs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docsRef = collection(db, "documents");
    const q = query(docsRef, where("travellerEmail", "==", email.toLowerCase()));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setDocs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.warn("useMandatoryDocuments listener error:", error);
        setDocs([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.email]);

  const missing = getMissingMandatoryDocuments(docs);

  return { loading, docs, missing, isComplete: missing.length === 0 };
};

export default useMandatoryDocuments;
