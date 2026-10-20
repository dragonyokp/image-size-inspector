const toggleButton = document.querySelector('#scanButton');
const toggleLabel = document.querySelector('#toggleLabel');

const setToggle = (enabled) => {
  const isEnabled = Boolean(enabled);
  const state = isEnabled ? 'ON' : 'OFF';
  toggleButton.setAttribute('aria-pressed', String(isEnabled));
  toggleButton.setAttribute('aria-label', `Image Size: ${state}`);
  toggleLabel.textContent = state;
};

const getCurrentTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('ไม่มีแท็บที่กำลังเปิดอยู่');
  return tab;
};

const prepareContent = async (tabId) => {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
};

const syncToggle = async () => {
  try {
    const tab = await getCurrentTab();
    const result = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
    setToggle(Boolean(result?.enabled));
  } catch {
    setToggle(false);
  }
};

const toggleInspector = async () => {
  toggleButton.disabled = true;
  try {
    const tab = await getCurrentTab();
    await prepareContent(tab.id);
    const result = await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_INSPECTOR' });
    if (!result?.ok) throw new Error('toggle failed');
    setToggle(Boolean(result.enabled));
  } catch {
    setToggle(false);
  } finally {
    toggleButton.disabled = false;
  }
};

toggleButton.addEventListener('click', toggleInspector);
syncToggle();
