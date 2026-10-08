'use client';
import {useEffect, useState} from 'react';
import type {Content} from '../content';

type Draft = {content: Content; version: number; savedAt: string};
export default function DraftRecovery({content, version, dirty, editor, onRestore}: {
  content: Content; version: number; dirty: boolean; editor: string; onRestore: (content: Content, version: number) => void;
}) {
  const key = `club-content-draft:${editor}`;
  const [saved, setSaved] = useState<Draft | null>(null);
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Read only after hydration, keeping the server and first browser render identical.
    const timer = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const draft = JSON.parse(raw) as Draft;
          if (draft.content && typeof draft.content.name === 'string' && Array.isArray(draft.content.programmes) && Number.isInteger(draft.version)) setSaved(draft);
        }
      } catch { setNotice('Draft recovery is unavailable in this browser. Keep this tab open until you publish.'); }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [key]);
  useEffect(() => {
    if (!ready || saved) return;
    const timer = setTimeout(() => {
      try {
        if (dirty) {
          sessionStorage.setItem(key, JSON.stringify({content, version, savedAt: new Date().toISOString()}));
          setNotice('Draft saved in this tab. You can recover it after a refresh.');
        } else { sessionStorage.removeItem(key); setNotice(''); }
      } catch { setNotice('Could not save a recovery copy. Keep this tab open until you publish.'); }
    }, 300);
    return () => clearTimeout(timer);
  }, [content, version, dirty, key, ready, saved]);
  if (saved) return <div className="notice draft-recovery"><p>An unpublished draft is available from this tab.{saved.version !== version && ' The website has changed since it was saved. Copy any needed text before discarding it; publishing this older draft will be blocked.'}</p><div><button type="button" className="button outline" onClick={()=>{onRestore(saved.content, saved.version);setSaved(null)}}>Restore draft</button><button type="button" className="button outline" onClick={()=>{try{sessionStorage.removeItem(key)}catch{}setSaved(null)}}>Discard saved draft</button></div></div>;
  return notice ? <p className="draft-notice" role="status">{notice}</p> : null;
}
