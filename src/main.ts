import "./styles.css";
import { CONTRACT_ADDRESS, isAddress } from "./config";

/**
 * Contract address handling. Until an official address is configured in
 * src/config.ts, every [data-ca] slot reads "TBA" and Copy CA is disabled.
 */
function setupContract(address: string): void {
  const valid = isAddress(address);
  const slots = document.querySelectorAll<HTMLElement>("[data-ca]");
  const button = document.querySelector<HTMLButtonElement>("#copy-ca");
  const hint = document.querySelector<HTMLElement>("#copy-ca-hint");
  const status = document.querySelector<HTMLElement>("#copy-ca-status");

  if (!valid) {
    if (address !== "") console.warn("Ignoring VITE_PEGZEUS_CA / OFFICIAL_CA: not a 0x address.");
    slots.forEach((slot) => (slot.textContent = "TBA"));
    if (button) button.disabled = true;
    return;
  }

  slots.forEach((slot) => {
    slot.textContent = address;
    slot.classList.add("is-address");
  });
  document.documentElement.dataset.caSet = "true";
  if (hint) hint.textContent = "Official contract address. Check it matches before you buy.";
  if (!button || !status) return;

  button.disabled = false;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(address);
      status.textContent = "Copied the contract address.";
      button.dataset.state = "copied";
    } catch {
      status.textContent = "Unable to copy. Select the address and copy it manually.";
      button.dataset.state = "error";
    }
    window.setTimeout(() => delete button.dataset.state, 2000);
  });
}

setupContract(CONTRACT_ADDRESS);
