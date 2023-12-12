// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import 'font-awesome/css/font-awesome.min.css';
// @ts-ignore
import Profile from '../Files/Aakash.jpg'
import { FaShareAlt } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  getDoc,
  query,
  where,
  deleteDoc,
  orderBy,
  limit,
  addDoc,
  arrayUnion,
} from "firebase/firestore";
import { db, auth } from "../Config/Firebase";
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import axios from 'axios'

function Dashboard() {
  const storage = getStorage();
  const [passwordType, setPasswordType] = useState(false);
  const [usageType, setUsageType] = useState("Share");
  const [chatLoaderButton, setChatLoaderButton] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [fileURL, setFileURL] = useState("");
  const [ranID, setRandID] = useState("");

  const passwordTypeChanger = (e) => {
    e.preventDefault();
    setPasswordType(!passwordType)
  }

  useEffect(() => {
    const h1Element = document.querySelector('.light');
    let startTime;
    const cycleColors = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const cycleDuration = 5000;
      const progress = (elapsed % cycleDuration) / cycleDuration;
      const currentColor = `rgb(${Math.round(255 * progress)}, ${Math.round(255 * progress)}, ${Math.round(255 * progress)})`;
      h1Element.style.color = currentColor;
      requestAnimationFrame(cycleColors);
    };
    requestAnimationFrame(cycleColors);
  }, []);

  const gradientBorder = {
    filter: 'drop-shadow(0 0 6px rgba(103,30,117,1)) drop-shadow(0 0 12px rgba(252,76,2,1))',
  };

  const handleChatFile = (file) => {
    if (file && file?.length !== 0 && file !== "") {
      const maxSize = 200 * 1024 * 1024;
      if (file.size <= maxSize) {
        setChatLoaderButton(true);
        const storageRef = ref(storage, `files/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const prog = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            // setProgress(prog);
            console.log(prog);
          },
          (error) => console.log(error),
          async () => {
            await getDownloadURL(uploadTask.snapshot.ref).then(
              (downloadURL) => {
                setFileURL(downloadURL);
                setChatLoaderButton(false);
              }
            );
          }
        );
      } else {
        toast.error("File limit should not exceed 200 MB");
      }
    }
  };

  async function generateRandomId(length) {
    const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';
    let randomId = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomId += characters.charAt(randomIndex);
    }
    return randomId;
  }

  const [fileData, setFileData] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [userOTP, setUserOTP] = useState("");
  const [url, setURL] = useState("");


  const uploadFunc = async (e) => {
    e.preventDefault();
    try {
      setChatLoaderButton(true);
      const randomID = await generateRandomId(6);
      const dbRef = doc(db, "File Sharing Application", randomID);
      setRandID(randomID);
      let Data = {
        verificationID: randomID,
        downloadStatus: "No",
        URL: fileURL
      };
      await setDoc(dbRef, Data);
      setChatLoaderButton(false);
      toast.success("Uploaded successfully");
      setOpenModal(true);
    } catch (error) {
      console.log(error);
    }
  }

  const downloadFile = async (e) => {
    e.preventDefault();
    const otp = e.target.OTP.value;
    const dbRef = doc(db, "File Sharing Application", otp);
    const docSnap = await getDoc(dbRef);
    if (docSnap.exists()) {
      try {
        setChatLoaderButton(true);
        setUserOTP(otp);
        const data = docSnap.data()
        const response = await axios.get(data.URL,
          {
            responseType: 'blob',
          }
        );

        const contentType = response.headers['content-type'];
        setURL(data.URL);
        setFileType(contentType);
        setFileData(response.data);
        setChatLoaderButton(false);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    } else {
      toast.error("Secret code is invalid")
    }
  };

  const delData = async () => {
    await deleteDoc(doc(db, "File Sharing Application", userOTP));
    setUsageType("Share");
  }

  useEffect(() => {
    if (fileData) {
      // Create a Blob with the file data and type
      const blob = new Blob([fileData], { type: fileType });

      // Create an anchor element for downloading
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);

      // Set the file name for downloading (you can set a default name if needed)
      const regex = /%2F(.*?)\?/;
      const match = url.match(regex);
      link.download = match[1];

      // Append the link to the DOM
      document.body.appendChild(link);

      // Trigger a click on the link to start the download
      link.click();

      // Remove the link from the DOM
      document.body.removeChild(link);
      delData()

      toast.success('Downloaded successfully');

    }
  }, [fileData, fileType]);

  const inputRef = useRef(null);

  const copyToClipboard = () => {
    inputRef.current.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    toast.success(`Copied to clipboard.`);
  };

  return (
    <>
      <ToastContainer />

      {openModal && (
        <>
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div
              className="fixed inset-0 w-full h-full bg-black opacity-40"
              onClick={() => setOpenModal(false)}
            ></div>
            <div className="flex items-center min-h-screen px-4 py-8">
              <div className="relative w-auto max-w-lg p-4 mx-auto rounded-md shadow-lg" style={{ backgroundImage: 'linear-gradient( 109.6deg,  rgba(103,30,117,1) 11.2%, rgba(252,76,2,1) 91.1% )' }}>
                <div className="mt-3 sm:flex">
                  <div className="flex items-center justify-center">
                    <img src={Profile} className='w-16 rounded-full' alt="Profile" style={gradientBorder} />
                  </div>
                  <div className="mt-2 text-center">
                    <h4 className="text-lg font-bold text-white">
                      Copy the code
                    </h4>
                    <div className="p-3 overflow-y-auto">
                      <div className="flex items-center">
                        <input
                          ref={inputRef}
                          type="text"
                          value={ranID}
                          readOnly
                          className="flex-1 p-2 border rounded-l"
                        />
                        <button
                          onClick={copyToClipboard}
                          className="p-2 border rounded-r cursor-pointer"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-3 sm:flex">
                      {/* <button
                        className="w-full mt-2 p-2.5 text-white bg-purple rounded-md outline-none ring-offset-2 ring-blue-500 focus:ring-2"
                        onClick={copyToClipboard}
                      >
                        Copy
                      </button> */}
                      <button
                        className="w-1/2 mt-2 p-2.5 text-white rounded-md outline-none border ring-offset-2 ring-indigo-600 focus:ring-2"
                        onClick={() => {
                          setOpenModal(false);
                          window.location.reload()
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ backgroundImage: 'linear-gradient( 109.6deg,  rgba(103,30,117,1) 11.2%, rgba(252,76,2,1) 91.1% )', minHeight: '100vh', minWidth: '100vw' }} className='cursor-crosshair'>
        <div className='flex flex-col justify-center items-center min-h-screen'>
          <div className='bg-white w-auto lg:w-5/6 h-auto lg:h-[570px] rounded-lg opacity-[0.9]' style={gradientBorder}>
            <div className='flex justify-between mx-auto p-4 md:p-8 lg:p-10'>
              <div>
                <img src={Profile} className='w-16 rounded-full' alt="Profile" style={gradientBorder} />
              </div>
              <div className='flex items-center gap-4'>
                <a href="https://www.facebook.com/AakashAare/" target="_blank"><i style={gradientBorder} className="fa fa-facebook hover:animate-bounce" aria-hidden="true"></i></a>
                <a href="https://www.instagram.com/meme_um_naan_um/" target="_blank"><i style={gradientBorder} className="fa fa-instagram hover:animate-bounce" aria-hidden="true"></i></a>
                <a href="https://devaakashportfolio.w3spaces.com/" target="_blank"><i style={gradientBorder} className="fa fa-globe hover:animate-bounce" aria-hidden="true"></i></a>
                <a href="https://www.linkedin.com/in/aakash-r-9a151024b" target="__blank"><i style={gradientBorder} className="fa fa-linkedin hover:animate-bounce" aria-hidden="true"></i></a>
                <a href="https://github.com/AakashTheDev" target="__blank"><i style={gradientBorder} className="fa fa-github hover:animate-bounce" aria-hidden="true"></i></a>
              </div>
            </div>
            <div className='flex flex-col lg:flex-row justify-center items-center'>
              <div className='flex flex-col lg:flex-row justify-around gap-10 px-8'>
                <div className='flex flex-col gap-2 space-y-3 w-auto lg:w-1/2'>
                  <h1 className='font-bold text-2xl uppercase'>Connective Bytes: Empowering The Seamless File Sharing &#129505;</h1>
                  <p className='text-lg uppercase text-justify'> "Experience the future of file sharing with <span className='font-bold uppercase'>Connective Bytes</span> – your go-to platform for seamless collaboration. Share files instantly, securely, and without hassle. Boost productivity, streamline teamwork, and elevate your digital sharing experience. Join the SwiftShare revolution today and redefine the way you collaborate!"</p>
                  <div className='flex flex-col lg:flex-row gap-2'>
                    <label htmlFor='File' style={{ backgroundImage: 'linear-gradient( 109.6deg,  rgba(103,30,117,1) 11.2%, rgba(252,76,2,1) 91.1% )' }} className='text-center p-3 px-4 font-semibold uppercase rounded-lg shadow-lg text-white cursor-pointer opacity-[0.9] hover:opacity-[1]'>Start Sharing <span className='px-2 font-bold'><i style={gradientBorder} className="fa fa-long-arrow-right" aria-hidden="true"></i></span></label>
                    <button style={{ backgroundImage: 'linear-gradient( 109.6deg,  rgba(103,30,117,1) 11.2%, rgba(252,76,2,1) 91.1% )' }} className='p-3 px-4 font-semibold uppercase rounded-lg shadow-lg text-white opacity-[0.9] hover:opacity-[1]'>Developer <a href='https://devaakashportfolio.w3spaces.com/' target='_blank' className='px-2 font-bold'><i style={gradientBorder} className="fa fa-globe" aria-hidden="true"></i></a></button>
                  </div>
                </div>
                <div className='flex flex-col gap-2'>

                  <div className='flex justify-end hover:cursor-pointer'>
                    <div className='flex p-2 rounded-lg'>
                      <div className={`${usageType === "Share" ? "bg-gradient-to-r from-purple-700 to-red-600 border-white" : "bg-white border-[rgba(252,76,2,1)]"} rounded-s-lg p-2 shadow-lg`} onClick={() => setUsageType("Share")}>
                        <FaShareAlt size={25} color={`${usageType === "Share" ? "white" : "rgba(252,76,2,1)"}`} />
                      </div>
                      <div className={`${usageType === "Download" ? "bg-gradient-to-r from-purple-700 to-red-600 border-white" : "bg-white border-[rgba(252,76,2,1)]"} rounded-e-lg p-2 shadow-lg`} onClick={() => setUsageType("Download")}>
                        <FaDownload size={25} color={`${usageType === "Download" ? "white" : "rgba(252,76,2,1)"}`} />
                      </div>
                    </div>
                  </div>

                  {usageType === "Share" && (
                    <form style={{ backgroundImage: 'linear-gradient( 109.6deg,  rgba(103,30,117,1) 11.2%, rgba(252,76,2,1) 91.1% )' }} className='flex flex-col gap-5 p-6 rounded-2xl' onSubmit={(e) => uploadFunc(e)}>
                      <h1 className='font-bold text-2xl uppercase text-center text-white'>File Sharing Application &#x1F90D;</h1>
                      {/* <div className='relative w-full'>
                      <input
                        type={passwordType ? "text" : "password"}
                        className='p-2 w-full border-white rounded-full font-bold text-[rgba(252,76,2,1)] outline-[rgba(252,76,2,1)] pr-10'
                        placeholder='Enter Password'
                        required
                      />
                      <i
                        className={`fa ${passwordType ? "fa-eye-slash" : "fa-eye"} absolute top-1/2 right-2 transform -translate-y-1/2 cursor-pointer`}
                        aria-hidden="true"
                        onClick={(e) => passwordTypeChanger(e)}
                      ></i>
                    </div> */}

                      <span style={{ color: "#FDFCFA" }}><input type='file' id='File' className='p-2 w-full' onChange={(e) => handleChatFile(e.target.files[0])} required /></span>
                      {chatLoaderButton ? (
                        <button
                          disabled
                          type="button"
                          className="bg-white text-[rgba(252,76,2,1)] font-medium rounded-full text-sm px-4 py-2"
                        >
                          <svg
                            aria-hidden="true"
                            role="status"
                            className="inline w-6 h-6 text-[rgba(252,76,2,1)] animate-spin"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                              fill="#E5E7EB"
                            />
                            <path
                              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      ) : (
                        <button type='submit' className='p-2 uppercase font-bold rounded-full bg-white text-[rgba(252,76,2,1)]'>Share</button>
                      )}
                    </form>
                  )
                  }

                  {usageType === "Download" && (
                    <form style={{ backgroundImage: 'linear-gradient( 109.6deg,  rgba(103,30,117,1) 11.2%, rgba(252,76,2,1) 91.1% )' }} className='flex flex-col gap-5 p-6 rounded-2xl' onSubmit={(e) => downloadFile(e)}>
                      <h1 className='font-bold text-2xl uppercase text-center text-white'>File Downloading Application &#x1F90D;</h1>
                      {/* <div className='relative w-full'>
                      <input
                        type={passwordType ? "text" : "password"}
                        className='p-2 w-full border-white rounded-full font-bold text-[rgba(252,76,2,1)] outline-[rgba(252,76,2,1)] pr-10'
                        placeholder='Enter Password'
                        required
                      />
                      <i
                        className={`fa ${passwordType ? "fa-eye-slash" : "fa-eye"} absolute top-1/2 right-2 transform -translate-y-1/2 cursor-pointer`}
                        aria-hidden="true"
                        onClick={(e) => passwordTypeChanger(e)}
                      ></i>
                    </div> */}
                      <input
                        type="text"
                        className='p-2 w-full border-white rounded-full font-bold text-[rgba(252,76,2,1)] outline-[rgba(252,76,2,1)]'
                        placeholder='Enter the secret code'
                        name="OTP"
                        required
                      />
                      {chatLoaderButton ? (
                        <button
                          disabled
                          type="button"
                          className="bg-white text-[rgba(252,76,2,1)] font-medium rounded-full text-sm px-4 py-2"
                        >
                          <svg
                            aria-hidden="true"
                            role="status"
                            className="inline w-6 h-6 text-[rgba(252,76,2,1)] animate-spin"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                              fill="#E5E7EB"
                            />
                            <path
                              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      ) : (
                        <button type='submit' className='p-2 uppercase font-bold rounded-full bg-white text-[rgba(252,76,2,1)]'>Download</button>
                      )}
                    </form>
                  )
                  }

                </div>
              </div>
            </div>
          </div>
          <div className='fixed bottom-0'>
            <h1 className='font-bold text-center uppercase tracking-[20px] light'>Developed with &#x1F90D; by <a href="https://devaakashportfolio.w3spaces.com/" target="_blank">Aakash</a></h1>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
