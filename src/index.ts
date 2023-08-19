import { get } from "@cdktf/cli-core";
import { Language } from "@cdktf/commons";
import { TerraformModuleConstraint } from "@cdktf/provider-generator";
import path from "path";
import fs from "fs-extra";

(async () => {
  const modules: any[] = require(path.resolve(process.cwd(), "modules.json"));
  console.log("Generating modules: ", JSON.stringify(modules, null, 2));

  const constraints: TerraformModuleConstraint[] = modules.map(
    (c) => new TerraformModuleConstraint(c)
  );

  const targets = {
    [Language.TYPESCRIPT]: "modules/typescript",
  };

  for (const [language, target] of Object.entries(targets)) {
    console.log(`Generating bindings for ${language} in ${target}`);
    fs.mkdirSync(target, { recursive: true });

    // Go needs a go.mod file in the target directory
    if (language === Language.GO) {
      fs.writeFileSync(
        path.join(target, "go.mod"),
        `module github.com/hashicorp/terraform-cdk/examples/go/aws

go 1.16
github.com/aws/constructs-go/constructs/v10 v10.1.94
github.com/aws/jsii-runtime-go v1.67.0
github.com/hashicorp/terraform-cdk-go/cdktf v0.17.1
`
      );
    }

    await get({
      constraints,
      constructsOptions: {
        targetLanguage: language as Language,
        codeMakerOutput: target,
      },
    });

    // Quick fix for the bug with bindings going into the wrong directory
    if (language === Language.JAVA) {
      fs.copySync(path.join(process.cwd(), "src/main"), target);
      fs.rmSync(path.join(process.cwd(), "src/main/"), {
        recursive: true,
      });
    }
  }

  console.log("Done!");
})();
