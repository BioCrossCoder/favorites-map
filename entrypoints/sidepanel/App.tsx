import { useState } from "react";
import {
  Action,
  Node,
  OperationMessage,
  SearchResultMessage,
} from "@/interface";

function App() {
  const [keyword, setKeyword] = useState("");
  const [data, setData] = useState(new Array<Node>());
  useEffect(() => {
    search(keyword);
  }, []);
  function search(keyword: string) {
    const message: OperationMessage = {
      action: Action.Search,
      data: keyword,
    };
    browser.runtime
      .sendMessage(message)
      .then((response: SearchResultMessage) => {
        setData(response.result);
      });
  }
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setKeyword(event.target.value);
    search(event.target.value);
  }
  return (
    <>
      <input
        type="text"
        placeholder="Search favorites map"
        value={keyword}
        onChange={handleChange}
      />
      <div>
        {Array.from(data).map((node: Node) => {
          return <li>{node.name}</li>;
        })}
      </div>
    </>
  );
}

export default App;
