import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  
  const page1 = await browser.newPage();
  const page2 = await browser.newPage();
  
  page1.on("console", msg => console.log("PAGE 1 CONSOLE:", msg.text()));
  page1.on("pageerror", err => console.error("PAGE 1 ERROR:", err));
  
  page2.on("console", msg => console.log("PAGE 2 CONSOLE:", msg.text()));
  page2.on("pageerror", err => console.error("PAGE 2 ERROR:", err));
  
  await page1.goto("http://localhost:5000");
  await page1.waitForTimeout(1000);
  
  // Click Play
  await page1.getByText(/PLAY|CREATE ROOM/i).nth(0).click();
  await page1.waitForTimeout(1000);
  
  // Get Room ID from page1
  const roomIdText = await page1.locator("p:has-text('Room Code:')").innerText();
  const roomId = roomIdText.split(":")[1].trim();
  console.log("Room created:", roomId);
  
  // Player 2 join
  await page2.goto("http://localhost:5000");
  await page2.waitForTimeout(1000);
  await page2.getByText(/JOIN ROOM/i).click();
  await page2.locator("input").fill(roomId);
  await page2.getByText(/JOIN/i).nth(1).click();
  await page2.waitForTimeout(1000);
  
  // Both select character and ready
  await page1.locator(".cursor-pointer").nth(0).click();
  await page1.getByText(/READY/i).click();
  
  await page2.locator(".cursor-pointer").nth(1).click();
  await page2.getByText(/READY/i).click();
  
  console.log("Both ready clicked.");
  
  await page1.waitForTimeout(5000);
  console.log("Done");
  await browser.close();
})();
