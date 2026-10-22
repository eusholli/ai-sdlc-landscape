// What a good request for change says. One copy, read by llms.txt and the contribute page; the
// issue form (.github/ISSUE_TEMPLATE/request.yml) and CONTRIBUTING.md repeat it, and a test keeps
// them in step.

export const REQUEST_INTRO = "Write it in your own words. A good request says:";

export const REQUEST_ADVICE: { title: string; body: string }[] = [
  { title: "Which tool.", body: "Its name, or its page on this site. For a new tool, its website." },
  {
    title: "What should change.",
    body: "What is wrong, missing or new: a price, a customer, an acquisition, a link to another tool, or a removal.",
  },
  {
    title: "Where it is published.",
    body: "A public link that shows it, ideally the vendor's own site or trade press. Listicles and \"top 10\" pages are not accepted, and a fact that is not published is left out.",
  },
  { title: "Whether you work for the vendor.", body: "Vendors are welcome; just say so." },
  { title: "If you are an agent,", body: "say so, and who you act for." },
];

export const REQUEST_OUTRO =
  "One issue can hold several changes. Each is checked, then accepted, or the issue is closed with the reason.";

/** The advice as a Markdown list, for text surfaces. */
export const requestAdviceMarkdown = () =>
  [REQUEST_INTRO, "", ...REQUEST_ADVICE.map((a, i) => `${i + 1}. **${a.title}** ${a.body}`), "", REQUEST_OUTRO].join("\n");
