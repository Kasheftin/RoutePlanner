<?php
define(RDIR,dirname(__FILE__));

$action = $_REQUEST["action"];
$result = array("data"=>[],"error"=>null,"success"=>null);

if (!file_exists(RDIR . "/projects")) {
	mkdir(RDIR . "/projects",0755);
}

if ($action == "getProjectsList") {
	$d = dir(RDIR . "/projects");
	while (($entry = $d->read()) !== false) {
		if (preg_match("/\.json$/",$entry) && is_file($d->path . "/" . $entry)) {
			try {
				$str = join("",file($d->path . "/" . $entry));
				$project = json_decode($str,true);
				$result["data"][] = array("id"=>preg_replace("/\.json$/","",$entry),"name"=>$project["name"]);
			}
			catch (Exception $e) {
				$result["error"] = $e->getMessage();
			}
		}
	}
	$result["success"] = "Project's list received";
}
elseif ($action == "getProject") {
	try {
		$id = preg_replace("/[^a-z0-9]/","",$_REQUEST["id"]);
		if (!$id) throw new Exception("Project id is not specified or is incorrect");
		if (!file_exists(RDIR . "/projects/" . $id . ".json")) throw new Exception("Project not found");
		$result["data"] = join("",file(RDIR . "/projects/" . $id . ".json"));
		$result["success"] = "Project has been loaded";
		$result["id"] = $id;
	}
	catch (Exception $e) {
		$result["error"] = $e->getMessage();
	}
}
elseif ($action == "deleteProject") {
	try {
		$id = preg_replace("/[^a-z0-9]/","",$_REQUEST["id"]);
		if (!$id) throw new Exception("Project id is not specified or is incorrect");
		if (!file_exists(RDIR . "/projects/" . $id . ".json")) throw new Exception("Project not found");
		unlink(RDIR . "/projects/" . $id . ".json");
		$result["success"] = "Project has been deleted";
	}
	catch (Exception $e) {
		$result["error"] = $e->getMessage();
	}
}
elseif ($action == "saveProject") {
	$jsonData = $_REQUEST["jsonData"];
	$id = preg_replace("/[^a-z0-9]/","",$_REQUEST["id"]);
	if (!$id) $id = generateUniqueId(20);
	$f = fopen(RDIR . "/projects/" . $id . ".json","w");
	fwrite($f,$jsonData);
	fclose($f);
	$result["id"] = $id;
	$result["success"] = "Project saved";
}

echo json_encode($result);

function generateUniqueId($n) {
	$availableCharacters = "qwertyuiopasdfghjklzxcvbnm1234567890";
	$id = "";
	for ($i = 0; $i < $n; $i++) {
		$id .= substr($availableCharacters,rand(0,strlen($availableCharacters)-1),1);
	}
	return $id;
}
