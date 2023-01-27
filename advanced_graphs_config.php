<?php

// echo json_encode($module->get_report_2());
echo json_encode($module->query("select * from redcap_reports")->fetch_all());
echo "<br>";
echo "<br>";
echo json_encode($module->query("describe redcap_reports")->fetch_assoc());
echo "<br>";
echo "<br>";

echo json_encode($module->query("select * from redcap_reports where report_id = 3")->fetch_assoc());
echo json_encode($module->query("select * from redcap_reports_fields where report_id = 3")->fetch_assoc());
?>