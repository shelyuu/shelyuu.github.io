<?php

/* ******************************************************** */
/* Please visit the help file to set correctly this file :) */
/* ******************************************************** */

// Set to "mailchimp" or "file"
$STORE_MODE = "mailchimp";

// MailChimp API Key findable in your Mailchimp's dashboard
$API_KEY =  "d5c1bb2730631e5eceacf34789c6c20c-us14";
			 
// MailChimp List ID  findable in your Mailchimp's dashboard
$LIST_ID =  "54b9fe6fe3";
			 
// After $_SERVER["DOCUMENT_ROOT"]." , write the path to your .txt to save the emails of the subscribers
$STORE_FILE = $_SERVER["DOCUMENT_ROOT"]."/subscription-list.txt";

/* ************************************ */
// Don't forget to check the path below
/* ************************************ */
 
require('MailChimp.php');

/* ***************************************************** */
// For the part below, no interventions are required
/* ***************************************************** */

if($_SERVER["REQUEST_METHOD"] == "POST" && !empty($_POST["email"])) {

	$email = $_POST["email"];
	
	header('HTTP/1.1 200 OK');
	header('Status: 200 OK');
	header('Content-type: application/json');

	// Checking if the email writing is good
	if(filter_var($email, FILTER_VALIDATE_EMAIL)) {
		
		// The part for the storage in a .txt
		if ($STORE_MODE == "file") {
			
			// SUCCESS SENDING
			if(@file_put_contents($STORE_FILE, strtolower($email)."\r\n", FILE_APPEND)) {
				echo json_encode(array(
						"status" => "success"
					));
			// ERROR SENDING
			} else {
				echo json_encode(array(
						"status" => "error",
						"type" => "FileAccessError"
					));
			}
		
		// The part for the storage in Mailchimp
		} elseif ($STORE_MODE == "mailchimp") {
			
			$MailChimp = new \Drewm\MailChimp($API_KEY);
			
			$result = $MailChimp->call('lists/subscribe', array(
		                'id'                => $LIST_ID,
		                'email'             => array('email'=>$email),
		                'double_optin'      => false,
		                'update_existing'   => true,
		                'replace_interests' => false,
		                'send_welcome'      => true,
		            ));     
	
			// SUCCESS SENDING
			if($result["email"] == $email) {     	
				echo json_encode(array(
						"status" => "success"
					));
			// ERROR SENDING
			} else {
				echo json_encode(array(
						"status" => "error",
						"type" => $result["name"]
					));
			}
		// ERROR
		} else {
			echo json_encode(array(
					"status" => "error",
				));
		}
	// ERROR DURING THE VALIDATION 
	} else {
		echo json_encode(array(
				"status" => "error",
				"type" => "ValidationError"
			));
	}
} else {
	header('HTTP/1.1 403 Forbidden');
	header('Status: 403 Forbidden');
}

?>