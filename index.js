const fs = require("fs");
const path = require("path");
const { stdin, stdout } = require("process");
const readline = require("readline");

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

const newWordDir = process.cwd();
const existFiles = [];

const printFiles = () => {
  const sourceExtensions = [".js", ".ts", ".jsx", ".tsx"];
  try {
    const allFiles = fs.readdirSync(newWordDir);

    const sourceFiles = allFiles.filter((file) => {
      const fileExtension = path.extname(file);
      return sourceExtensions.includes(fileExtension);
    });

    console.log("현재 폴더의 소스 파일 목록: ");
    console.log(sourceFiles);
    return sourceFiles;
  } catch (error) {
    console.error(error);
  }
};

// 재귀적으로 질문하여 스니펫을 만드는 함수
const askQuestions = (() => {
  let idx = 0;
  const questions = [
    "prefix",
    "description",

    "바꿀 변수 (원본, 새이름, -1 입력시 종료)",
  ];
  const replaceWordTuple = [];
  const snippet = {};

  // 클로저를 사용하여 상태(idx, questions 등)를 유지
  return (sourceCode) => {
    // 마지막 질문 순서
    // const lastQuestionIdx = questions.length - 1;

    rl.question(`${questions[idx]}: `, (answer) => {
      // "prefix", "description" 질문 처리
      if (idx < questions.length - 1) {
        snippet[questions[idx]] = answer;
        idx += 1;
        askQuestions(sourceCode); // 다음 질문으로
        return;
      }

      // "바꿀 변수" 질문 처리 및 종료 조건
      if (answer.trim() === "-1") {
        // replace는 새로운 문자열을 반환하므로 다시 할당해야 함
        // RegExp와 'g' 플래그로 모든 일치 항목을 치환
        // let modifiedCode = sourceCode;
        replaceWordTuple.forEach((tuple) => {
          const [pre, newWord] = tuple;
          if (pre && newWord) {
            const regExp = new RegExp(pre.trim(), "g");
            sourceCode = sourceCode.replace(regExp, newWord.trim());
          }
        });

        snippet.body = sourceCode.split("\n");

        console.log("\n--- 생성된 스니펫 ---");
        console.log(JSON.stringify(snippet, null, 2));
        console.log("--------------------");

        rl.close();
        return;
      }

      // 사용자가 입력한 변수명(예: "oldVarl, newVar")을 배열에 추가
      replaceWordTuple.push(answer.split(","));
      askQuestions(sourceCode); // 계속해서 변수 입력받기
    });
  };
})();

// 프로그램 시작 함수
const start = () => {
  console.log(`현재 작업 디렉토리: ${newWordDir}`);

  const files = printFiles();
  if (files && files.length > 0) {
    existFiles.push(...files);
    askSourceFile();
  } else {
    console.log("현재 폴더에 소스 파일이 없습니다.");
    rl.close();
  }
};

const askSourceFile = () => {
  rl.question(
    "내용을 읽어올 소스 코드 파일명을 입력하세요 (예: example.ts): ",
    (fileName) => {
      const regExp = /['\[\]"\s,]/g;
      fileName = fileName.trim().replace(regExp, "");
      if (existFiles.includes(fileName)) {
        // 파일명을 올바르게 입력받은 후에 readFile을 실행
        const filePath = path.join(newWordDir, fileName);
        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) {
            console.error("파일을 읽는 중 에러가 발생했습니다.", err);
            rl.close();
            return;
          }
          console.log(
            `\n'${fileName}' 파일의 내용을 읽었습니다. 스니펫 생성을 시작합니다.`
          );
          // 파일 내용을 인자로 전달하며 질문 시작
          askQuestions(data);
        });
      } else {
        console.log("존재하지 않는 파일명입니다. 다시 입력하세요.");
        askSourceFile(); // 잘못된 입력 시 다시 질문
      }
    }
  );
};

rl.on("close", () => {
  console.log("\n프로그램이 정상적으로 종료되었습니다.");
  process.exit(0);
});

// 프로그램 실행
start();
