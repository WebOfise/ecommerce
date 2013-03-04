<?php
/**
 * Coupons REST API controller
 * @author Pavel Kovalyov <pavlo.kovalyov@gmail.com>
 *
 * @package Store
 * @since 2.0.0
 */
class Api_Store_Coupons extends Api_Service_Abstract {

	/**
	 * @var array Access Control List
	 */
	protected $_accessList = array(
		Tools_Security_Acl::ROLE_SUPERADMIN => array(
			'allow' => array('get', 'post', 'put', 'delete')
		),
        Tools_Security_Acl::ROLE_ADMIN => array(
			'allow' => array('get', 'post', 'put', 'delete')
		),
        Shopping::ROLE_SALESPERSON => array(
			'allow' => array('get', 'post', 'put', 'delete')
		)
	);

	public function getAction() {
		$id = filter_var($this->_request->getParam('id'), FILTER_SANITIZE_NUMBER_INT);
		if ($id){
			// return $model;
		} else {
			return array_map(function($coupon){ return $coupon->toArray(); }, Store_Mapper_CouponMapper::getInstance()->fetchAll());
		}
	}

	public function postAction() {
		$data = filter_var_array($this->getRequest()->getPost(), FILTER_SANITIZE_STRING);

		if (empty($data)){
			$this->_error();
		}

		if (!isset($data['code']) || empty($data['code'])){
			$this->_error('Missing mandatory code parameter');
		}

		if (isset($data['startDate']) && empty($data['startDate'])){
			unset($data['startDate']);
		}

		if (isset($data['endDate']) && empty($data['endDate'])){
			unset($data['endDate']);
		}

		if (isset($data['scope']) && empty($data['scope'])){
			unset($data['scope']);
		}

		$model = new Store_Model_Coupon($data);
		if (isset($data['data']) && is_array($data['data'])){
			foreach($data['data'] as $key=>$value){
				$model->{'set'.ucfirst($key)}($value);
			}
		}

		if (Store_Mapper_CouponMapper::getInstance()->save($model)) {
		}

		return $model->toArray();
	}

	public function putAction() {
	}

	public function deleteAction() {
		$id = filter_var($this->_request->getParam('id'), FILTER_SANITIZE_NUMBER_INT);

		if (!$id) {
			$this->_error();
		}

		return Store_Mapper_CouponMapper::getInstance()->delete($id);
	}


}
