import {
  Action,
  DeleteMessage,
  SearchMessage,
  SearchResultMessage,
  UpsertMessage,
} from "@/interface";
import { useState } from "react";
function App() {
  const [title, setTitle] = useState("");
  const [url, setURL] = useState("");
  useEffect(() => {
    browser.tabs
      .query({
        active: true,
        currentWindow: true,
      })
      .then((tabs) => {
        setTitle(tabs[0].title as string);
        setURL(tabs[0].url as string);
      })
      .then(() => fetchSelectOptions(""));
  }, []);
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }
  const [options, setOptions] = useState<string[]>([]);
  const [option, setOption] = useState("");
  async function fetchSelectOptions(keyword: string) {
    const message: SearchMessage = {
      action: Action.Search,
      data: keyword,
    };
    browser.runtime
      .sendMessage(message)
      .then((response: SearchResultMessage) => {
        setOptions(response.result.map((item) => item.name));
      });
  }
  function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setOption(event.target.value);
  }
  function handleClickSave() {
    const message: UpsertMessage = {
      action: Action.Upsert,
      data: {
        name: title,
        url: url,
        relatedNodeNames: [],
      },
    };
    browser.runtime.sendMessage(message).then(() => {
      // window.close();
    });
  }
  function handleClickDelete() {
    const message: DeleteMessage = {
      action: Action.Delete,
      data: url,
    };
    browser.runtime.sendMessage(message);
    window.close();
  }
  return (
    <>
      <input type="text" value={title} onChange={handleChange} />
      <select value={option} onChange={handleSelectChange}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button onClick={handleClickSave}>Save</button>
      <button onClick={handleClickDelete}>Delete</button>
    </>
  );
}

export default App;
