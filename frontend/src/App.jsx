// import { useState } from "react";
// import axios from "axios";
// import MapView from "./components/MapView";
// import { searchPlaces } from "./services/locationService";
// function App() {
//   const [start, setStart] = useState("");
//   const [destination, setDestination] = useState("");
//   const [route, setRoute] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [startSuggestions, setStartSuggestions] = useState([]);

//   const planTrip = async () => {
//     if (!start || !destination) {
//       alert("Enter both locations");
//       return;
//     }

//     try {
//       setLoading(true);

//       const res = await axios.post("http://localhost:5000/api/trip/route", {
//         start,
//         destination,
//       });

//       setRoute(res.data);
//     } catch (err) {
//       console.error(err);
//       alert("Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 text-white p-6">
//       {/* HEADER */}
//       <h1 className="text-3xl font-bold text-center mb-6">Travel Planner</h1>

//       {/* INPUT BAR */}
//       <div className="flex flex-col md:flex-row gap-3 justify-center mb-6">
//         <input
//           placeholder="Start Location"
//           value={start}
//           onChange={async (e) => {
//             const value = e.target.value;
//             setStart(value);

//             const results = await searchPlaces(value);
//             setStartSuggestions(results);
//           }}
//           className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
//         />

//         {startSuggestions.length > 0 && (
//           <div className="bg-gray-800 border mt-1 rounded">
//             {startSuggestions.map((item, index) => (
//               <div
//                 key={index}
//                 className="p-2 hover:bg-gray-700 cursor-pointer"
//                 onClick={() => {
//                   setStart(item.display_name);
//                   setStartSuggestions([]);
//                 }}
//               >
//                 {item.display_name}
//               </div>
//             ))}
//           </div>
//         )}

//         <input
//           placeholder="Destination"
//           value={destination}
//           onChange={(e) => setDestination(e.target.value)}
//           className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
//         />

//         <button
//           onClick={planTrip}
//           disabled={loading}
//           className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
//         >
//           {loading ? "Planning..." : "Go"}
//         </button>
//       </div>

//       {/* MAIN */}
//       <div className="flex flex-col md:flex-row gap-4">
//         {/* MAP */}
//         <div className="flex-1 h-125 rounded-lg overflow-hidden">
//           <MapView route={route} />
//         </div>

//         {/* SIDEBAR */}
//         <div className="w-full md:w-80 bg-gray-800 p-4 rounded-lg border border-gray-700">
//           {!route && (
//             <p className="text-gray-400">Plan a trip to see details</p>
//           )}

//           {route && (
//             <>
//               <h2 className="text-lg font-semibold mb-3">🚗 Trip Summary</h2>

//               <p>
//                 <b>From:</b> {start}
//               </p>
//               <p>
//                 <b>To:</b> {destination}
//               </p>
//               <p>
//                 <b>Distance:</b> {(route.distance / 1000).toFixed(1)} km
//               </p>
//               <p>
//                 <b>Duration:</b> {(route.duration / 3600).toFixed(1)} hrs
//               </p>

//               <hr className="my-3 border-gray-600" />

//               <h3 className="font-semibold mb-2">📍 Recommended Stops</h3>

//               {route.places?.length === 0 ? (
//                 <p className="text-gray-400">No places found</p>
//               ) : (
//                 route.places.map((place, index) => (
//                   <div
//                     key={index}
//                     className="bg-gray-700 p-3 rounded mb-2 hover:bg-gray-600 transition"
//                   >
//                     <p className="font-medium">
//                       {place.tags?.name || "Unnamed Place"}
//                     </p>

//                     <p className="text-xs text-gray-400">
//                       {place.tags?.amenity || place.tags?.tourism || "Place"}
//                     </p>
//                   </div>
//                 ))
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;

import { useState } from "react";
import axios from "axios";
import MapView from "./components/MapView";
import { searchPlaces } from "./services/locationService";

function App() {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);

  let timeout;

  const handleSearch = (value, setter) => {
    clearTimeout(timeout);

    timeout = setTimeout(async () => {
      const results = await searchPlaces(value);
      setter(results);
    }, 400);
  };

  const planTrip = async () => {
    if (!start || !destination) {
      alert("Enter both locations");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/api/trip/route", {
        start,
        destination,
      });

      setRoute(res.data);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Travel Planner</h1>

      {/* INPUT SECTION */}
      <div className="flex flex-col md:flex-row gap-3 justify-center mb-6 relative z-50">
        {/* START INPUT */}
        <div className="relative w-full md:w-64">
          <input
            placeholder="Start Location"
            value={start}
            onChange={(e) => {
              const value = e.target.value;
              setStart(value);
              handleSearch(value, setStartSuggestions);
            }}
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
          />

          {startSuggestions.length > 0 && (
            <div className="absolute w-full bg-gray-800 border mt-1 rounded z-50 max-h-40 overflow-y-auto shadow-lg">
              {startSuggestions.map((item, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setStart(item.display_name);
                    setStartSuggestions([]);
                  }}
                >
                  {item.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DESTINATION INPUT */}
        <div className="relative w-full md:w-64">
          <input
            placeholder="Destination"
            value={destination}
            onChange={(e) => {
              const value = e.target.value;
              setDestination(value);
              handleSearch(value, setDestSuggestions);
            }}
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
          />

          {destSuggestions.length > 0 && (
            <div className="absolute w-full bg-gray-800 border mt-1 rounded z-50 max-h-40 overflow-y-auto shadow-lg">
              {destSuggestions.map((item, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setDestination(item.display_name);
                    setDestSuggestions([]);
                  }}
                >
                  {item.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BUTTON */}
        <button
          onClick={planTrip}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          {loading ? "Planning..." : "Go"}
        </button>
      </div>

      {/* MAIN */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* MAP */}
        <div className="flex-1 h-125 rounded-lg overflow-hidden z-0">
          <MapView route={route} />
        </div>

        {/* SIDEBAR */}
        <div className="w-full md:w-80 bg-gray-800 p-4 rounded-lg border border-gray-700">
          {!route && (
            <p className="text-gray-400">Plan a trip to see details</p>
          )}

          {route && (
            <>
              <h2 className="text-lg font-semibold mb-3">🚗 Trip Summary</h2>

              <p>
                <b>From:</b> {start}
              </p>
              <p>
                <b>To:</b> {destination}
              </p>
              <p>
                <b>Distance:</b> {(route.distance / 1000).toFixed(1)} km
              </p>
              <p>
                <b>Duration:</b> {(route.duration / 3600).toFixed(1)} hrs
              </p>

              <hr className="my-3 border-gray-600" />

              <h3 className="font-semibold mb-2">📍 Recommended Stops</h3>

              {route.places?.length === 0 ? (
                <p className="text-gray-400">No places found</p>
              ) : (
                route.places.map((place, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 p-3 rounded mb-2 hover:bg-gray-600 transition"
                  >
                    <p className="font-medium">
                      {place.tags?.name || "Unnamed Place"}
                    </p>

                    <p className="text-xs text-gray-400">
                      {place.tags?.amenity || place.tags?.tourism || "Place"}
                    </p>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
