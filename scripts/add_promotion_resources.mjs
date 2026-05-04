#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const filePath = path.resolve("output/resources_table_final.json");
const rows = JSON.parse(await fs.readFile(filePath, "utf8"));

const additions = [
  {
    Resource: "ИнстаПромо",
    Rubric: "Продвижение",
    Subrubric: "SMM и соцсети",
    Link: "https://xn----btbk5aiy7d.xn--p1ai/insta",
    Slug: "insta-promo",
    Description:
      "Сервис для продвижения Instagram-аккаунтов с накруткой активности, подписчиков и социальных сигналов.",
    AccessStatus: "ok",
    Screenshot:
      "https://s.wordpress.com/mshots/v1/https%3A%2F%2Fxn----btbk5aiy7d.xn--p1ai%2Finsta?w=1200",
    ScreenshotSource: "web",
    InfoSource: "manual",
  },
  {
    Resource: "TapLike",
    Rubric: "Продвижение",
    Subrubric: "SMM и соцсети",
    Link: "https://app.taplike.ru/app/orders/make-order",
    Slug: "taplike",
    Description:
      "Платформа для заказа лайков, подписчиков, просмотров и другой социальной активности для соцсетей и контент-площадок.",
    AccessStatus: "требует логин",
    Screenshot:
      "https://s.wordpress.com/mshots/v1/https%3A%2F%2Fapp.taplike.ru%2Fapp%2Forders%2Fmake-order?w=1200",
    ScreenshotSource: "web",
    InfoSource: "manual",
  },
  {
    Resource: "PRTUT",
    Rubric: "Продвижение",
    Subrubric: "SMM и соцсети",
    Link: "https://prtut.ru/newkabinet/logon.php",
    Slug: "prtut",
    Description:
      "Сервис для продвижения в соцсетях через покупку лайков, подписчиков, просмотров и других метрик активности.",
    AccessStatus: "требует логин",
    Screenshot:
      "https://s.wordpress.com/mshots/v1/https%3A%2F%2Fprtut.ru%2Fnewkabinet%2Flogon.php?w=1200",
    ScreenshotSource: "web",
    InfoSource: "manual",
  },
  {
    Resource: "Telderi",
    Rubric: "Продвижение",
    Subrubric: "Покупка и аналитика площадок",
    Link: "https://www.telderi.ru/ru/search/max?maxType%5Bmaxchannel%5D=true&maxType%5Bmaxchat%5D=true",
    Slug: "telderi-max",
    Description:
      "Маркетплейс для поиска, покупки и анализа Telegram-каналов, чатов, сайтов и других цифровых активов.",
    AccessStatus: "ok",
    Screenshot:
      "https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.telderi.ru%2Fru%2Fsearch%2Fmax%3FmaxType%255Bmaxchannel%255D%3Dtrue%26maxType%255Bmaxchat%255D%3Dtrue?w=1200",
    ScreenshotSource: "web",
    InfoSource: "manual",
  },
];

const existingSlugs = new Set(rows.map((row) => row.Slug));

for (const item of additions) {
  if (!existingSlugs.has(item.Slug)) {
    rows.push(item);
  }
}

rows.sort((a, b) => {
  if (a.Rubric !== b.Rubric) return a.Rubric.localeCompare(b.Rubric, "ru");
  if (a.Subrubric !== b.Subrubric) return a.Subrubric.localeCompare(b.Subrubric, "ru");
  return a.Resource.localeCompare(b.Resource, "ru");
});

await fs.writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");

console.log(`updated:${rows.length}`);
