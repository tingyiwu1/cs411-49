# 411 group 49
wow amazing
# Demo Vid

https://github.com/tingyiwu1/cs411-49/assets/68577990/675db454-dfad-43a0-9bbb-058d59463690

## Setting up local environment
### clone repo
```bash
git clone git@github.com:tingyiwu1/cs411-49.git
```
### open project folder in vscode
i suggest opening frontend and backend folder in separate vscode windows/workspaces

### have nvm installed
https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating

### set the correct node version
```bash
nvm install 19
```
```bash
nvm use 19
```
## backend setup
in the /backend folder...

install dependencies 
```bash
npm i
```
to run the thing
```bash
npm run dev
```
or if ur doing a test script
```bash
npx ts-node path/to/script.ts
```
see `api_tests.ts` for example code
### credentials etc
`.env.example` contains what `.env` should look like. make a `.env` file in the same directory and text me for sharing api keys
## frontend setup
its basically the same thing
```bash
npm i
npm run dev
```
