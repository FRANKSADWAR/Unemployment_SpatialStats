(function(){
    // starting with the calculate function called by the event handlers within the HTML.
    // Its a good practice to always separate the HTML and the JS 

    function calculate(){


        // get the input and look for output elements from the HTML
        var amount = document.getElementById("amount");
        var apr = document.getElementById("apr");
        var years = document.getElementById("years");
        var zipcode = document.getElementById("zipcode");
        var payment = document.getElementById("payment");
        var total = document.getElementById("total");
        var totalinterest = document.getElementById("totalinterest");
        


        /**
         * Get user's input from the input elements, convert interest from percentage to a decimal
         * and annual rate from from percentage to decimal, annual rate to monthly rate. Convert payment
         * in years to the number of monthly payments
         */

        var principal = parseFloat(amount.value);
        var interest = parseFloat(apr.value)/100/12 ;
        var payments = parseFloat(years.value) * 12;

        // Now compute the monthly payment figure
        var x = Math.pow(1+ interest,payments);
        var monthly = (principal * x * interest ) / (x-1);

        // if the users input is a finite number, the input was good and we have meaningful
        // results to display
        if(isFinite(monthly)){
            payment.innerHTML = monthly.toFixed(2);
            totalinterest.innerHTML = (( monthly * payments )- principal).toFixed(2);
            total.innerHTML = (monthly * payments).toFixed(2);
            // Save the user's input so we can restore it the newxt time they visit
            save(amount.value,apr.value,years.value,zipcode.value);

            
            // Advertise : find and display local lenders, but ignore network errors
            try { // catch errors occuring within these curly braces
                getLenders(amount.value,apr.value,years.value,zipcode.value);
                
            } catch (error) { /**Ignore these errors */
                // Finally, chart loan balance and interest and equity payments
            }
            chart(principal,interest,monthly,payments);
        }
        else{
            // The input was not a finite number, meaning its ainvalid, clear prevously displayed outputs
            payment.innerHTML = "";          // clear the contents of these elements
            total.innerHTML = "";
            totalinterest.innerHTML = "";
            chart();  // clear the chart
        }
    }


    /**
     * Not all browsers support local storage functionality e.g Firefox
     * Although it works over http. Save the user's input as properties of the localStorage
     * object.
     */
    
    function save(amount,apr,years,zipcode){
        if(window.localStorage){
            localStorage.loan_amount = amount;
            localStorage.loan_apr = apr;
            localStorage.loan_years = years;
            localStorage.loan_zipcode = zipcode;
        }
    }

    // Automatically attemp to restore input fields when document first loads
    window.onload = function(){
        // If the browser supports localStorage and we have stored some data
        if(window.localStorage && localStorage.loan_amount){
            document.getElementById("amount").value = localStorage.loan_amount;
            document.getElementById("apr").value = localStorage.loan_apr;
            document.getElementById("years").value = localStorage.loan_years;
            document.getElementById("zipcode").value = localStorage.loan_zipcode;
        }
    };
    
    /**
     * Pass the user's input to a server-side script which can (in theory) returns a list of links
     * to local lenders interested in making loans. This example does not actually exist in this prpject 
     * of such a lender-finding service. But if the service existed, this function would work with it.
     * 
     */


    function getLenders(amount,apr,years,zipcode){
        // If the browser does not support XMLHttpRequest, do nothing
        if (!(window.XMLHttpRequest)) return ;
        
        // find the element to display list of lenders in
        var ad = document.getElementById("lenders");
        if(!ad) return ;


        // get the lenders data from the html page instead ------------<><><>


        // Encode the user's input as query parameter in a URL
        var url = "getLenders.php" + 
            "?amt=" + encodeURIComponent(amount) + 
            "&apr=" + encodeURIComponent(apr) +
            "&yrs=" + encodeURIComponent(years) + 
            "&zip=" + encodeURIComponent(zipcode);

        // fetch the contents of that URL using the XHR object
        var req = new XMLHttpRequest();
        req.open("GET",url,true);  // prepare the request and make sure its an asynchronous request
        req.send(null);            // send the request

        /**Register an event handler function that will be called at some later time when the 
         * HTTP Server's response arrives.  */
        
        req.onreadystatechange = function(){
            if(req.readyState == 4 && req.status == 200){
                var response = req.responseText;    // Get the text
                var lenders = JSON.parse(response); // convert the string to a JS object

                // convert the lender object to HTML
                var list = "";
                for(var i =0 ; i < lenders.length ; i ++){
                    list += "<li><a href='" + lenders[i].url + "'>" + lenders[i].name+ "<a></li>";
                }
                // Display the HTML in the element from the loop above
                ad.innerHTML = "<ul>" + list + "</ul>";
            }
            else{
                ad.innerHTML = "Unable to get the lenders contacts at the moment";
            }
        } 
    }

    // Chart the monthly balance, loan balance,interest and equity in an HTML <canvas> element
    // If called without any previous chart then just erase any previously drawn chart

    function chart(principal,interest,monthly,payments){
        var graph = document.getElementById("graph");
        graph.width = graph.width; // magic to clear and reset the canvas element

        /**
         * If we call this function without args or if browser doesn't support graphics in a 
         * canvas element,then just return now
         */

        if(arguments.length == 0 || (!graph.getContext)) return;
        
        // Get the "context " object for the <canvas> that defines the drawing API
        var g = graph.getContext("2d"); // All drawings to be done with this object
        var width = graph.width, height = graph.height;  // Get canvas size

        // These functions convert payment numbers and dollar amounts to pixels
        function paymentToX(n){
            return n * width/payments;
        }
        function amountToY(a){
            return height - (a * height/(monthly * payments * 1.05));
        }

        // payments are straight line from (0,0) to (payments, monthly * payments)
        g.moveTo(paymentToX(0),amountToY(0));                         // start at lower left
        g.lineTo(paymentToX(payments),amountToY(monthly*payments));   // Draw to upper right

        g.lineTo(paymentToX(payments),amountToY(0)); // Down to lower right
        g.closePath();                               // And back to start
        g.fillStyle = "rgb(42, 184, 251)";           // light red
        g.fill();                                    // Fill the triangle
        g.font = "bold 12px sans-serif";
        g.fillText("Total Interest Payments",20,20)  // Draw text in legend


        // cumulative equity is non-linear and trickier to chart but we shall
        var equity = 0;
        g.beginPath();       // begin a new shape
        g.moveTo(paymentToX(0),amountToY(0));           // start at lower left
        for(var p = 1; p <= payments; p ++){
            // For each payment, figure out how much is interest
            var thisMonthsInterest = (principal - equity) * interest ;
            equity += (monthly - thisMonthsInterest);    // the rest goes to equity
            g.lineTo(paymentToX(p),amountToY(equity));   // line to this point
        }
        g.lineTo(paymentToX(payments),amountToY(0));     // line back to x axis
        g.closePath();                                   // back to start point
        g.fillStyle = "rgb(7, 187, 7)";                  // now use the green paint
        g.fill();                                        // And fill the area under the curve
        g.fillText("Total Equity",20,35);

        // Loop again as above but chrt loN BlNCE AS A THICK BLACK LINE
        var bal = principal;
        g.beginPath();
        g.moveTo(paymentToX(0),amountToY(bal));
        for(var p = 1; p <= payments; p ++){
            var thisMonthsInterest = bal * interest ;
            bal -= (monthly - thisMonthsInterest);         // the rest goes to equity
            g.lineTo(paymentToX(p),amountToY(bal));        // Draw line to this point
        }

        g.lineWidth = 3;                                   // use a thick line
        g.stroke();                                        // draw the balance curve
        g.fillStyle = "#012b66";                           // switch to dark blue text
        g.fillText("Loan Balance",20,50);                  // legend entry

        // Now make yearly tick marks and year numbers on X axis
        g.textAlign = "center";                            // center text over ticks
        var y = amountToY(0);                              // y coordinate of X axis
        for(var year = 1; year*12 <= payments; year++){    // for each year
            var x = paymentToX(year*12);                   // compute tick position 
            g.fillRect(x-0.5,y-3,1,3);                     // Draw the tick 
            if(year == 1) g.fillText("Year",x,y-5);        // Number every five years
            if(year % 5 == 0 && year*12 !== payments)      
                g.fillText(String(year),x,y-5);

        }

        // Mark payment amounts along the right edge
        g.textAlign = "right";                               // right justify the text
        g.textBaseline = "middle";                           // center it vertically
        var ticks = [ monthly * payments,principal];         // the two points we'll mark
        var rightEdge = paymentToX(payments);               // x coordinate of Y axis
        for (var i=0 ; i < ticks.length; i++){               // for each of the two points
            var y = amountToY(ticks[i]);                     // compute Y position of the tick
            g.fillRect(rightEdge-3,y-0.5,3,1);               // Draw the tick mark
            g.fillText(String(ticks[i].toFixed(0)),rightEdge-5,y);   // And label it


        }
    }

    var allInput = document.querySelectorAll('.calc');
    console.log(allInput);

    for (var i =0 ; i < allInput.length; i++){
        if (document.addEventListener){
            allInput[i].addEventListener("change",function(e){
                calculate();
            },false);
        }
        else{
            allInput[i].attachEvent("onchange",function(e){
                calculate();
            },false);
        }
    }

}());