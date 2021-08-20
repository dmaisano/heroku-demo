import fs from "fs";
import { promisify } from "util";
import ejs from "ejs";

export const readFile = promisify(fs.readFile);

type getTemplateParams = {
  filename: `home`;
  data: any;
};

export const getTemplate = async (params: getTemplateParams) => {
  const filename = `${params.filename}.ejs`;

  try {
    const filePath = `./views/${filename}`;

    const viewFile = await readFile(filePath, {
      encoding: `utf-8`,
    });

    const view = ejs.render(viewFile, params.data);

    return view;
  } catch (error) {
    const errorMessage = `== EJS Template Render Error ==\n${JSON.stringify(
      error,
    )}`;
    console.log(errorMessage);
    return new Error(errorMessage);
  }
};
