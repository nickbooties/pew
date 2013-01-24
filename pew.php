<?php
/*
    pew.php - Nick Booth 2012

*/
    ?>
      <script type='text/javascript' src='jquery-1.8.1.min.js'></script>
      <script type='text/javascript' src='intersection.js'></script>
      <script type='text/javascript' src='pew.js'></script>
      <script type='text/javascript' src='pew_functions.js'></script>
      <link rel='stylesheet' type='text/css' href='pew.css' />
    <?php
    ?><html>
        <body>
            <canvas height='600' width='800' id='pew_canvas' oncontextmenu="return false;"></canvas>
            <div id='pew_options'>
                <h3>Options:</h3>
                <ul>
                    <li>Callsign: <input type='text' name='pew_playername' maxlength=10></li>
                    <li>Colour: <input type='color' name='pew_playercolour' ></li>
                </ul>
                
            </div>
        </body>
    </html>
<?php

?>