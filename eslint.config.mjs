import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import jest from "eslint-plugin-jest";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    globalIgnores(["@types/**/*", "coverage/**/*", "dist/**/*", "node_modules/**/*"]),
    {
        extends: fixupConfigRules(compat.extends(
            "plugin:@typescript-eslint/recommended",
            "plugin:import/errors",
            "plugin:import/warnings",
            "plugin:jest/recommended",
            "plugin:prettier/recommended",
        )),

        plugins: {
            "@typescript-eslint": fixupPluginRules(typescriptEslint),
            jest: fixupPluginRules(jest),
        },

        languageOptions: {
            globals: {
                ...jest.environments.globals.globals,
                Atomics: "readonly",
                SharedArrayBuffer: "readonly",
            },

            parser: tsParser,
            ecmaVersion: 2018,
            sourceType: "module",

            parserOptions: {
                project: "./tsconfig.json",
            },
        },

        settings: {
            "import/resolver": {
                node: {
                    paths: ["src"],
                    extensions: [".js", ".ts"],
                },

                typescript: {},
            },
        },

        rules: {
            "import/extensions": ["error", "ignorePackages", {
                js: "never",
                ts: "never",
            }],

            "@typescript-eslint/lines-between-class-members": "off",
            "class-methods-use-this": "off",
            curly: ["error", "all"],
            "import/no-cycle": "off",
            "import/no-named-as-default": "off",
            "import/no-named-as-default-member": "off",
            "jest/no-disabled-tests": "warn",
            "jest/no-focused-tests": "error",
            "jest/no-mocks-import": "warn",
            "jest/no-identical-title": "error",

            "jest/no-standalone-expect": ["error", {
                additionalTestBlockFunctions: ["each.test", "beforeAll", "afterAll"],
            }],

            "jest/prefer-to-have-length": "warn",
            "jest/valid-expect": "error",

            "lines-between-class-members": ["error", "always", {
                exceptAfterSingleLine: true,
            }],

            "max-classes-per-file": "off",
            "no-nested-ternary": "off",

            "no-param-reassign": ["error", {
                props: false,
            }],

            "no-restricted-syntax": "off",
            "no-return-await": "warn",
            "no-throw-literal": "off",

            "no-underscore-dangle": ["warn", {
                allowAfterThis: true,
            }],

            "prefer-destructuring": "off",
            "require-await": "warn",
        },
    },
]);