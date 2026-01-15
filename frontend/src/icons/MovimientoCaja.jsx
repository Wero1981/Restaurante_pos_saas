const MovimientoCaja = ({ className = "size-6", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
   <path d="M4 15c1.5 1 3 2 5 2h5c1.5 0 2.5-1 2.5-2s-1-2-2.5-2H9.5c-.5 0-1-.5-1-1s.5-1 1-1h6.5" /> 
   <path d="M4 15v2c0 2 2 4 4 4h6c2 0 4-2 4-4v-2" /> 
 
   <circle cx="18" cy="6" r="3" /> 
   <text x="18" y="6.5" textAnchor="middle" fontSize="2.5" fill="currentColor">$</text> 
   <circle cx="14" cy="3" r="2" /> <circle cx="21" cy="3" r="2" />
  </svg>
);

export default MovimientoCaja;