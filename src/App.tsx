import { Settings, ClipboardCopy, Expand, Shrink } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea.tsx';
import { SnippetGroup, Snippet, parseConfig } from '@/lib/snippets';

export function App() {
  // state for snippets dialog
  const [open, setOpen] = useState(false);
  // snippet groups
  const [snippetGroups, setSnippetGroups] = useState<SnippetGroup[]>([]);
  // recent snippets
  const [recentSnippets, setRecentSnippets] = useState<Snippet[]>([]);

  // state for settings dialog
  const [openSettings, setOpenSettings] = useState(false);
  // snippet config (markdown string)
  const [config, setConfig] = useState('');
  // config saved
  const [isSaved, setIsSaved] = useState(true);
  // config saved message
  const [message, setMessage] = useState('');
  // full screen state
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    // load snippet settings from local storage
    chrome.storage.local.get(['config'], (result) => {
      const config = result.config || '';
      setConfig(config);
      setSnippetGroups(parseConfig(config));
    });
  }, []);

  useEffect(() => {
    // load recent snippets from local storage
    chrome.storage.local.get(['recentSnippets'], (result) => {
      const recentSnippets = result.recentSnippets || [];
      setRecentSnippets(recentSnippets);
    });
  }, []);

  const updateRecentSnippets = (snippet: Snippet) => {
    chrome.storage.local.get(['recentSnippets'], (result) => {
      let recentSnippets: Snippet[] = result.recentSnippets || [];
      recentSnippets = recentSnippets.filter((s) => s.name !== snippet.name); // remove snippet if already exists
      recentSnippets.unshift(snippet); // add to top of array
      if (recentSnippets.length > 3) {
        recentSnippets.pop(); // max 3 recent snippets
      }

      chrome.storage.local.set({ recentSnippets: recentSnippets }, () => {
        setRecentSnippets(recentSnippets);
      });
    });
  };

  const handleFullScreenToggle = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleSnippetSelect = (snippet: Snippet) => {
    // This div is ProseMirror editor
    const div = document.getElementById('prompt-textarea') as HTMLDivElement;
    if (div) {
      // remove placeholder p tag
      const placeholderP = div.querySelector('p[data-placeholder]');
      if (placeholderP) {
        div.removeChild(placeholderP);
      }

      // append snippet
      const lines = snippet.body.split('\n');
      let n = 0;
      lines.forEach((line) => {
        const p = document.createElement('p');
        p.textContent = line;
        n += 1;
        console.log(n);
        console.log(line);
        div.appendChild(p);
      });

      // focus textarea
      setTimeout(() => {
        div.focus();
      }, 0);

      updateRecentSnippets(snippet);
    }
    setOpen(false);
  };

  const handleOpenSettings = () => {
    setOpenSettings(true);
    setOpen(false);
    setIsFullScreen(false);
  };

  const handleSave = () => {
    // Save snippet settings to local storage
    chrome.storage.local.set({ config: config }, () => {
      setSnippetGroups(parseConfig(config));
      setIsSaved(true);
      setMessage('Changes have been saved');

      // Clear recent snippets
      // Because the snippet settings have changed, the recent snippets may no longer be in sync with the current settings.
      chrome.storage.local.set({ recentSnippets: [] }, () => {
        setRecentSnippets([]);
      });

      setTimeout(() => {
        setMessage(''); // clear message
      }, 3000);
    });
  };

  return (
    <>
      {/* Snippets Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput className="border-none" style={{ boxShadow: 'none' }} placeholder="Type to search prompt snippets..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {recentSnippets.length > 0 && (
            <CommandGroup heading="Recently Used">
              {recentSnippets.map((snippet, sIndex) => {
                return (
                  <CommandItem key={`recent-snippet-${sIndex}`} value={`Recent/${snippet.name}/${snippet.description}`} onSelect={() => handleSnippetSelect(snippet)}>
                    <div className="flex items-center gap-x-3">
                      <ClipboardCopy className="h-4 w-4 text-slate-500" />
                      <div className="flex flex-col gap-y-1">
                        <div className="text-sm text-slate-900 dark:text-slate-50">{snippet.name}</div>
                        {snippet.description !== '' && <div className="text-xs text-slate-500 dark:text-slate-400">{snippet.description}</div>}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          {snippetGroups.map((snippetGroup, gIndex) => {
            return (
              <CommandGroup key={`group-${gIndex}`} heading={snippetGroup.name}>
                {snippetGroup.snippets.map((snippet, sIndex) => {
                  return (
                    <CommandItem key={`snippet-${gIndex}-${sIndex}`} value={`${snippetGroup.name}/${snippet.name}/${snippet.description}`} onSelect={() => handleSnippetSelect(snippet)}>
                      <div className="flex items-center gap-x-3">
                        <ClipboardCopy className="h-4 w-4 text-slate-500" />
                        <div className="flex flex-col gap-y-1">
                          <div className="text-sm text-slate-900 dark:text-slate-50">{snippet.name}</div>
                          {snippet.description !== '' && <div className="text-xs text-slate-500 dark:text-slate-400">{snippet.description}</div>}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
        <div className="flex justify-end items-center py-1 px-2 border-t border-gray-200 dark:border-gray-700">
          {snippetGroups.length === 0 && <div className="flex-1 text-right text-amber-500 mr-1">There are no valid snippets. Check the configuration →</div>}
          <Button variant="ghost" className="text-xs px-2 h-8" onClick={handleOpenSettings}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </div>
      </CommandDialog>

      {/* Settings Dialog */}
      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className={`flex flex-col justify-start ${isFullScreen ? 'h-screen w-screen max-w-full sm:rounded-none sm:border-none sm:shadow-none' : ''}`}>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="w-full flex-1 flex flex-col gap-y-2">
            <p>
              Enter your prompt snippets in the box below. The format is Markdown. For more details, see the{' '}
              <a href="https://github.com/kohkimakimoto/chatgpt-prompt-snippets-chrome-extension#configuration" target="_blank" className="text-blue-500">
                Configuration document
              </a>
              .
            </p>
            <div className={`relative ${isFullScreen ? 'h-full' : ''}`}>
              <Textarea
                className={`min-h-[240px] ${isFullScreen ? 'h-full' : ''}`}
                value={config}
                onChange={(e) => {
                  setConfig(e.target.value);
                  setIsSaved(false);
                }}
              />
              <Button variant="ghost" size="icon" className="absolute top-0 right-0 hover:bg-transparent" onClick={handleFullScreenToggle}>
                {isFullScreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
              </Button>
            </div>
            {!isSaved && <p className="text-red-500">You have unsaved changes.</p>}
            {isSaved && message && <p className="text-green-500">{message}</p>}
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
